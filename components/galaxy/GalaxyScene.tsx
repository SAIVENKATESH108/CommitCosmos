'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars as DreiStars, Line, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Star, Cluster, Constellation, StarFactory } from '@/lib/galaxy';
import { useGalaxyStore } from '@/lib/store';
import type { GalaxyCommit, GalaxyProject, GalaxyConstellation } from '@/lib/queries';

/**
 * ==============================================================================
 * Architectural Decision: Rendering Threshold & Performance Budget
 * ==============================================================================
 * Individual Mesh vs. Instanced Mesh / Point Cloud Rendering:
 *
 * In WebGL and React Three Fiber, each individual `<mesh>` with unique materials
 * generates its own draw call and per-frame overhead in Three.js's scene-graph
 * traversal (matrix updates, uniform uploads, bounding volume tests).
 *
 * - N <= 200: Individual emissive sphere meshes deliver rich interactivity
 *   (independent pulsing animations, per-star hover raycasting, dynamic ignition,
 *   individual scaling, and direct event dispatch).
 * - N > 200: 200 individual draw calls begin exceeding the 16.6ms frame budget (60 FPS)
 *   on mobile GPUs and integrated graphics. Above this threshold, we switch to
 *   InstancedMesh or Point Cloud rendering, condensing hundreds of star entities
 *   into a single GPU draw call while preserving spectral color and position attributes.
 * ==============================================================================
 */
const INSTANCED_RENDERING_THRESHOLD = 200;

interface GalaxySceneProps {
  commits: GalaxyCommit[];
  projects: GalaxyProject[];
  constellations?: GalaxyConstellation[];
}

/**
 * Individual animated star sphere for datasets <= INSTANCED_RENDERING_THRESHOLD.
 */
function AnimatedStarSphere({
  star,
  isNew,
  isSelected,
  onSelect,
}: {
  star: Star;
  isNew: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [ignitionPhase, setIgnitionPhase] = useState(isNew ? 0 : 1);
  const [hovered, setHovered] = useState(false);

  // Trigger star domain entity ignite
  useEffect(() => {
    if (isNew) {
      star.ignite();
    }
  }, [isNew, star]);

  // Satisfying ignition curve: shoots up with a gentle bloom overshoot, then settles into stable orbit
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (ignitionPhase < 1) {
      const nextPhase = Math.min(1, ignitionPhase + delta * 2.2);
      setIgnitionPhase(nextPhase);

      // Elastic overshoot for stellar birth
      const overshoot = Math.sin(nextPhase * Math.PI) * 0.45;
      const currentScale = nextPhase + overshoot;
      meshRef.current.scale.setScalar(currentScale);

      // Momentary high-energy supernova flash during ignition
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = 1.5 + Math.sin(nextPhase * Math.PI) * 4.0;
      }
    } else {
      // Gentle hovering pulse when focused or selected
      const targetScale = isSelected ? 1.6 : hovered ? 1.3 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 8
      );

      if (materialRef.current) {
        const targetIntensity = isSelected
          ? 3.5
          : hovered
          ? 2.5
          : Math.max(0.9, star.brightness * 1.8);
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          materialRef.current.emissiveIntensity,
          targetIntensity,
          delta * 6
        );
      }
    }
  });

  const baseColor = useMemo(() => new THREE.Color(star.color), [star.color]);

  return (
    <mesh
      ref={meshRef}
      position={[star.position.x, star.position.y, star.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(star.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={Math.max(0.9, star.brightness * 1.8)}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}

/**
 * High-performance InstancedMesh renderer when star count > 200.
 */
function InstancedStarCloud({
  stars,
  selectedStarId,
  onSelect,
}: {
  stars: Star[];
  selectedStarId: string | null;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorArray = useMemo(() => {
    const array = new Float32Array(stars.length * 3);
    const tempColor = new THREE.Color();
    stars.forEach((star, i) => {
      tempColor.set(star.color);
      tempColor.toArray(array, i * 3);
    });
    return array;
  }, [stars]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    stars.forEach((star, i) => {
      dummy.position.set(star.position.x, star.position.y, star.position.z);
      dummy.scale.setScalar(star.id === selectedStarId ? 1.8 : 1.0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [stars, selectedStarId]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, stars.length]}
      onClick={(e) => {
        if (e.instanceId !== undefined && stars[e.instanceId]) {
          e.stopPropagation();
          onSelect(stars[e.instanceId].id);
        }
      }}
    >
      <sphereGeometry args={[0.6, 12, 12]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial
        vertexColors
        roughness={0.2}
        metalness={0.2}
      />
    </instancedMesh>
  );
}

/**
 * Internal galaxy world with gentle auto-rotation and constellation lines.
 */
function GalaxyWorld({
  stars,
  constellationLines,
  isLargeDataset,
  previousStarIdsRef,
  selectedStarId,
  setSelectedStarId,
}: {
  stars: Star[];
  constellationLines: [number, number, number][][];
  isLargeDataset: boolean;
  previousStarIdsRef: React.MutableRefObject<Set<string>>;
  selectedStarId: string | null;
  setSelectedStarId: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user OS preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Subtle continuous slow auto-rotation when user isn't dragging
  useFrame((_, delta) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Star Rendering (Individual or Instanced depending on performance budget) */}
      {isLargeDataset ? (
        <InstancedStarCloud
          stars={stars}
          selectedStarId={selectedStarId}
          onSelect={(id) => setSelectedStarId(id)}
        />
      ) : (
        stars.map((star) => {
          const isNew = !previousStarIdsRef.current.has(star.id);
          return (
            <AnimatedStarSphere
              key={star.id}
              star={star}
              isNew={isNew}
              isSelected={selectedStarId === star.id}
              onSelect={(id) => setSelectedStarId(id === selectedStarId ? null : id)}
            />
          );
        })
      )}

      {/* 2. Constellation Lines between consecutive stars in completed constellations */}
      {constellationLines.map((linePoints, idx) => (
        <Line
          key={`constellation-line-${idx}`}
          points={linePoints}
          color="#a5b4fc"
          lineWidth={2.0}
          transparent
          opacity={0.7}
        />
      ))}
    </group>
  );
}

/**
 * ==============================================================================
 * GalaxyScene Component
 * ==============================================================================
 * Pure presentation 3D viewport powered by React Three Fiber and Drei.
 * Consumes domain model entities and placement math without duplicating them.
 * ==============================================================================
 */
export function GalaxyScene({ commits, projects, constellations }: GalaxySceneProps) {
  const { selectedStarId, setSelectedStarId } = useGalaxyStore();
  const previousStarIdsRef = useRef<Set<string>>(new Set());

  // 1. Memoize Domain Model Instantiation via StarFactory so placement math
  // only recomputes when the underlying commits count or ids change.
  const { stars } = useMemo(() => {
    const total = commits.length;
    const constructedStars = commits.map((commit, index) =>
      StarFactory.fromCommit(commit, index, total, 45)
    );

    // Group into Cluster domain models
    const starMapByProject = new Map<string, Star[]>();
    commits.forEach((commit, i) => {
      const list = starMapByProject.get(commit.projectId) || [];
      list.push(constructedStars[i]);
      starMapByProject.set(commit.projectId, list);
    });

    const constructedClusters = projects.map((project) => {
      const cluster = new Cluster(project.id, project.repoName);
      const projectStars = starMapByProject.get(project.id) || [];
      projectStars.forEach((star) => cluster.addStar(star));
      return cluster;
    });

    return { stars: constructedStars, clusters: constructedClusters };
  }, [commits, projects]);

  // Track previous stars to detect newly ignited ones
  useEffect(() => {
    const currentIds = new Set(stars.map((s) => s.id));
    // Update ref after render cycle
    const timer = setTimeout(() => {
      previousStarIdsRef.current = currentIds;
    }, 1200);
    return () => clearTimeout(timer);
  }, [stars]);

  // 2. Build Constellation Connector Lines (only for completed constellations where streak >= 7)
  const constellationLines = useMemo(() => {
    if (!constellations || constellations.length === 0 || stars.length < 2) {
      return [];
    }

    const lines: [number, number, number][][] = [];

    constellations.forEach((c) => {
      // Build domain model to check completion milestone
      const constStars = stars.slice(0, Math.min(stars.length, c.streakLength));
      const model = new Constellation(constStars, c.streakLength);

      if (model.isComplete && constStars.length >= 2) {
        const linePoints: [number, number, number][] = constStars.map((s) => [
          s.position.x,
          s.position.y,
          s.position.z,
        ]);
        lines.push(linePoints);
      }
    });

    return lines;
  }, [constellations, stars]);

  const isLargeDataset = stars.length > INSTANCED_RENDERING_THRESHOLD;

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#030712]">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 20, 85], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => setSelectedStarId(null)}
      >
        {/* Dark Space Background Color */}
        <color attach="background" args={['#030712']} />

        {/* Ambient & Directional Starlight */}
        <ambientLight intensity={0.4} />
        <pointLight position={[100, 100, 100]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-100, -100, -100]} intensity={0.8} color="#818cf8" />

        {/* Deep cosmic background starfield */}
        <DreiStars
          radius={200}
          depth={60}
          count={3000}
          factor={4}
          saturation={0.5}
          fade
          speed={0.5}
        />

        {/* Interactive Galaxy Universe */}
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <GalaxyWorld
            stars={stars}
            constellationLines={constellationLines}
            isLargeDataset={isLargeDataset}
            previousStarIdsRef={previousStarIdsRef}
            selectedStarId={selectedStarId}
            setSelectedStarId={setSelectedStarId}
          />
        </Float>

        {/* Orbit Controls with Damping */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={15}
          maxDistance={180}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
export default GalaxyScene;
