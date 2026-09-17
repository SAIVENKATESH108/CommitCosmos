'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars as DreiStars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Star, Cluster, StarFactory } from '@/lib/galaxy';
import {
  buildConstellationChains,
  computeConstellationEdges,
  type ConstellationEdge,
} from '@/lib/galaxy/Constellation';
import { useGalaxyStore } from '@/lib/store';
import type { GalaxyCommit, GalaxyProject, GalaxyConstellation, GalaxyBranch, GalaxyRelease, GalaxyClosedIssue } from '@/lib/queries';
import { Atmosphere } from '@/components/galaxy/Atmosphere';
import { BloomEffects } from '@/components/galaxy/BloomEffects';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { StarTooltip } from '@/components/galaxy/StarTooltip';
import { CameraControls } from '@/components/galaxy/CameraControls';
import { ProtostarCore } from '@/components/galaxy/ProtostarCore';
import { ProtostarOverlay } from '@/components/galaxy/ProtostarOverlay';
import { ConstellationConnector } from '@/components/galaxy/ConstellationConnector';
import { BranchMoon } from '@/components/galaxy/BranchMoon';
import { SupernovaEffect } from '@/components/galaxy/SupernovaEffect';
import { ClusterReleaseHalo } from '@/components/galaxy/ClusterReleaseHalo';
import { PrMergeStar } from '@/components/galaxy/PrMergeStar';
import { ShootingStar } from '@/components/galaxy/ShootingStar';

// Suppress Three.js Clock deprecation warning emitted by legacy internal libraries
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
      return;
    }
    originalWarn(...args);
  };
}

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
  branches?: GalaxyBranch[];
  releases?: GalaxyRelease[];
  closedIssues?: GalaxyClosedIssue[];
  constellations?: GalaxyConstellation[];
  username?: string;
}

/**
 * ==============================================================================
 * CursorManager
 * ==============================================================================
 * A renderless R3F component that sets the canvas cursor style in response to
 * the Zustand hoveredStarId. Must live inside <Canvas> to access useThree().
 * ==============================================================================
 */
function CursorManager() {
  const { gl } = useThree();
  const hoveredStarId = useGalaxyStore((s) => s.hoveredStarId);

  useEffect(() => {
    const cursor = hoveredStarId ? 'pointer' : 'default';
    gl.domElement.style.cursor = cursor;
    document.body.style.cursor = cursor;
    return () => {
      gl.domElement.style.cursor = 'default';
      document.body.style.cursor = 'default';
    };
  }, [hoveredStarId, gl]);

  return null;
}

/**
 * ==============================================================================
 * CameraAnimator
 * ==============================================================================
 * Handles smooth 60fps eased interpolation of the 3D camera position and
 * OrbitControls target.
 *
 * Honors `prefers-reduced-motion`: if active, snaps immediately to the target
 * without animating, preventing vestibular discomfort.
 * ==============================================================================
 */
interface CameraAnimationTarget {
  id: number;
  targetPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  duration: number;
}

function CameraAnimator({
  controlsRef,
  animationTarget,
  onAnimationEnd,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  animationTarget: CameraAnimationTarget | null;
  onAnimationEnd: () => void;
}) {
  const { camera } = useThree();
  const animatingRef = useRef(false);
  const elapsedRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const startLookAtRef = useRef(new THREE.Vector3());
  const currentTargetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animationTarget || animationTarget.id === currentTargetIdRef.current) return;
    currentTargetIdRef.current = animationTarget.id;

    // Check prefers-reduced-motion OS preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      camera.position.copy(animationTarget.targetPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(animationTarget.targetLookAt);
        controlsRef.current.update();
      }
      animatingRef.current = false;
      onAnimationEnd();
      return;
    }

    startPosRef.current.copy(camera.position);
    startLookAtRef.current.copy(
      controlsRef.current?.target ?? new THREE.Vector3(0, 0, 0)
    );
    elapsedRef.current = 0;
    animatingRef.current = true;
  }, [animationTarget, camera, controlsRef, onAnimationEnd]);

  useFrame((_, delta) => {
    if (!animatingRef.current || !animationTarget) return;

    elapsedRef.current += delta;
    const rawT = Math.min(1, elapsedRef.current / animationTarget.duration);

    // Smooth cubic ease-in-out curve for natural, intentional camera glide
    const eased =
      rawT < 0.5
        ? 4 * rawT * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

    camera.position.lerpVectors(
      startPosRef.current,
      animationTarget.targetPos,
      eased
    );

    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(
        startLookAtRef.current,
        animationTarget.targetLookAt,
        eased
      );
      controlsRef.current.update();
    }

    if (rawT >= 1) {
      animatingRef.current = false;
      onAnimationEnd();
    }
  });

  return null;
}

/**
 * Individual animated star sphere for datasets <= INSTANCED_RENDERING_THRESHOLD.
 *
 * Interaction model:
 *  - An invisible hit-target sphere (1.4× visible radius, transparent, no depth-write)
 *    captures all pointer events. This avoids the situation where the bloom halo
 *    makes the clickable area feel smaller than the visual glow.
 *  - onPointerOver  → sets hoveredStarId (clears on pointer-out, desktop only)
 *  - onClick        → toggles pinnedStarId (persists after pointer leaves, works on touch)
 *  - Both feed the same selectedStarId for scale/glow so 3D animation stays in sync.
 */
function AnimatedStarSphere({
  star,
  isNew,
  isSelected,
}: {
  star: Star;
  isNew: boolean;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [ignitionPhase, setIgnitionPhase] = useState(isNew ? 0 : 1);
  const [localHovered, setLocalHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { setHoveredStarId, pinnedStarId, setPinnedStarId } =
    useGalaxyStore();

  // Trigger star domain entity ignite
  useEffect(() => {
    if (isNew) {
      star.ignite();
    }
  }, [isNew, star]);

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setLocalHovered(true);
      setHoveredStarId(star.id);
    },
    [star.id, setHoveredStarId]
  );

  const handlePointerOut = useCallback(() => {
    setLocalHovered(false);
    setHoveredStarId(null);
  }, [setHoveredStarId]);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      // Toggle: clicking the pinned star un-pins it; clicking a new star pins it
      const next = pinnedStarId === star.id ? null : star.id;
      setPinnedStarId(next);
    },
    [star.id, pinnedStarId, setPinnedStarId]
  );

  // Satisfying ignition curve: shoots up with a gentle bloom overshoot, then settles
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (prefersReducedMotion) {
      if (ignitionPhase < 1) setIgnitionPhase(1);
      const baseScale = star.sizeMultiplier;
      const targetScale = isSelected ? baseScale * 1.6 : localHovered ? baseScale * 1.3 : baseScale;
      meshRef.current.scale.setScalar(targetScale);

      if (materialRef.current) {
        const baseIntensity = star.brightnessMultiplier;
        const targetIntensity = isSelected
          ? baseIntensity * 3.5
          : localHovered
          ? baseIntensity * 2.5
          : Math.max(0.9, star.brightness * 1.8 * baseIntensity);
        materialRef.current.emissiveIntensity = targetIntensity;
      }
      return;
    }

    if (ignitionPhase < 1) {
      const nextPhase = Math.min(1, ignitionPhase + delta * 2.2);
      setIgnitionPhase(nextPhase);

      // Elastic overshoot for stellar birth, scaled by commit magnitude sizeMultiplier
      const overshoot = Math.sin(nextPhase * Math.PI) * 0.45;
      const currentScale = (nextPhase + overshoot) * star.sizeMultiplier;
      meshRef.current.scale.setScalar(currentScale);

      // Momentary high-energy supernova flash during ignition
      if (materialRef.current) {
        materialRef.current.emissiveIntensity =
          (1.5 + Math.sin(nextPhase * Math.PI) * 4.0) * star.brightnessMultiplier;
      }
    } else {
      // Gentle hovering pulse when focused or selected, respecting commit magnitude
      const baseScale = star.sizeMultiplier;
      const targetScale = isSelected ? baseScale * 1.6 : localHovered ? baseScale * 1.3 : baseScale;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 8
      );

      if (materialRef.current) {
        const baseIntensity = star.brightnessMultiplier;
        const targetIntensity = isSelected
          ? baseIntensity * 3.5
          : localHovered
          ? baseIntensity * 2.5
          : Math.max(0.9, star.brightness * 1.8 * baseIntensity);
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          materialRef.current.emissiveIntensity,
          targetIntensity,
          delta * 6
        );
      }
    }
  });

  const baseColor = useMemo(() => new THREE.Color(star.color), [star.color]);
  const pos: [number, number, number] = [star.position.x, star.position.y, star.position.z];

  return (
    <group position={pos}>
      {/* Visible emissive star sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={Math.max(0.9, star.brightness * 1.8 * star.brightnessMultiplier)}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Invisible hit-target: 1.4× radius scaled with magnitude for comfortable click/tap area */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        renderOrder={1}
      >
        <sphereGeometry args={[1.4 * star.sizeMultiplier, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
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
      const baseScale = star.sizeMultiplier;
      dummy.scale.setScalar(star.id === selectedStarId ? baseScale * 1.8 : baseScale);
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
  constellationEdges,
  isLargeDataset,
  previousStarIdsRef,
  previousEdgeIdsRef,
  selectedStarId,
  setSelectedStarId,
  activeMoons,
  clusters,
  branchCommitsMap,
  onCollapseComplete,
  releases,
  activeSupernovas,
  onSupernovaComplete,
  activeShootingStars,
  onShootingStarComplete,
}: {
  stars: Star[];
  constellationEdges: ConstellationEdge[];
  isLargeDataset: boolean;
  previousStarIdsRef: React.MutableRefObject<Set<string>>;
  previousEdgeIdsRef: React.MutableRefObject<Set<string>>;
  selectedStarId: string | null;
  setSelectedStarId: (id: string | null) => void;
  activeMoons: GalaxyBranch[];
  clusters: Cluster[];
  branchCommitsMap: Map<string, GalaxyCommit[]>;
  onCollapseComplete: (branchId: string) => void;
  releases?: GalaxyRelease[];
  activeSupernovas: string[];
  onSupernovaComplete: (projectId: string) => void;
  activeShootingStars: GalaxyClosedIssue[];
  onShootingStarComplete: (issueId: string) => void;
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
          onSelect={(id) => {
            // On instanced cloud, clicking sets pinnedStarId via store directly
            const store = useGalaxyStore.getState();
            const next = store.pinnedStarId === id ? null : id;
            store.setPinnedStarId(next);
            setSelectedStarId(next);
          }}
        />
      ) : (
        stars.map((star) => {
          const isNew = !previousStarIdsRef.current.has(star.id);
          return star.isPrMerge ? (
            <PrMergeStar
              key={star.id}
              star={star}
              isNew={isNew}
              isSelected={selectedStarId === star.id}
            />
          ) : (
            <AnimatedStarSphere
              key={star.id}
              star={star}
              isNew={isNew}
              isSelected={selectedStarId === star.id}
            />
          );
        })
      )}

      {/* 2. Constellation Lines between consecutive-day stars with scaling opacity & animated draw-in */}
      {constellationEdges.map((edge) => {
        const isNew = !previousEdgeIdsRef.current.has(edge.id);
        return (
          <ConstellationConnector
            key={edge.id}
            edge={edge}
            isNew={isNew}
          />
        );
      })}

      {/* 3. Non-Default Branches as Subtle Orbiting Moons with Mini Star-Trails */}
      {activeMoons.map((branch, idx) => {
        const cluster = clusters.find((c) => c.repoId === branch.projectId) || clusters[0];
        const centroid = cluster ? cluster.centroid : { x: 0, y: 0, z: 0 };
        const bCommits = branchCommitsMap.get(branch.id) || [];
        return (
          <BranchMoon
            key={branch.id}
            branch={branch}
            centroid={centroid}
            commits={bCommits}
            orbitIndex={idx}
            onCollapseComplete={onCollapseComplete}
          />
        );
      })}

      {/* 4. Permanent Cluster Release Halos (for any repository with >= 1 tagged release) */}
      {clusters.map((cluster) => {
        const clusterReleases = (releases || []).filter((r) => r.projectId === cluster.repoId);
        if (clusterReleases.length === 0) return null;
        return (
          <ClusterReleaseHalo
            key={`halo-${cluster.repoId}`}
            centroid={cluster.centroid}
            releases={clusterReleases}
          />
        );
      })}

      {/* 5. Celebratory Supernova Expanding Shockwaves (triggered on newly published releases) */}
      {activeSupernovas.map((projectId) => {
        const cluster = clusters.find((c) => c.repoId === projectId) || clusters[0];
        const centroid = cluster ? cluster.centroid : { x: 0, y: 0, z: 0 };
        return (
          <SupernovaEffect
            key={`supernova-${projectId}`}
            centroid={centroid}
            onComplete={() => onSupernovaComplete(projectId)}
          />
        );
      })}

      {/* 6. Transient Celebratory Shooting Stars on Issue Closure */}
      {activeShootingStars.map((issue) => (
        <ShootingStar
          key={`shooting-star-${issue.id}`}
          id={issue.id}
          issueNumber={issue.issueNumber}
          onComplete={onShootingStarComplete}
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
export function GalaxyScene({
  commits,
  projects,
  branches = [],
  releases = [],
  closedIssues = [],
  constellations: _constellations,
  username,
}: GalaxySceneProps) {
  const { selectedStarId, setSelectedStarId } = useGalaxyStore();
  const previousStarIdsRef = useRef<Set<string>>(new Set());

  // Track newly arrived releases to trigger supernova shockwaves
  const [activeSupernovas, setActiveSupernovas] = useState<string[]>([]);
  const knownReleaseIdsRef = useRef<Set<string> | null>(null);

  // Track newly closed issues to trigger transient celebratory shooting stars
  const [activeShootingStars, setActiveShootingStars] = useState<GalaxyClosedIssue[]>([]);
  const knownClosedIssueIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!closedIssues) return;
    const currentIds = new Set(closedIssues.map((i) => i.id));

    if (knownClosedIssueIdsRef.current === null) {
      // Seed with initial closed issues so historical closures don't trigger shooting stars on mount
      knownClosedIssueIdsRef.current = currentIds;
      return;
    }

    // Only play if the user currently has the tab/page open and active
    const isTabActive = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const newClosed = closedIssues.filter((i) => !knownClosedIssueIdsRef.current!.has(i.id));
    knownClosedIssueIdsRef.current = currentIds;

    if (newClosed.length > 0 && isTabActive) {
      setActiveShootingStars((prev) => [...prev, ...newClosed]);
    }
  }, [closedIssues]);

  const handleShootingStarComplete = useCallback((issueId: string) => {
    setActiveShootingStars((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  useEffect(() => {
    if (!releases) return;
    const currentIds = new Set(releases.map((r) => r.id));

    if (knownReleaseIdsRef.current === null) {
      // Seed with initial releases so historical releases don't play animation on mount
      knownReleaseIdsRef.current = currentIds;
      return;
    }

    const newReleases = releases.filter((r) => !knownReleaseIdsRef.current!.has(r.id));
    if (newReleases.length > 0) {
      knownReleaseIdsRef.current = currentIds;
      const projectIds = Array.from(new Set(newReleases.map((r) => r.projectId)));
      setActiveSupernovas((prev) => [...prev, ...projectIds]);
    }
  }, [releases]);

  const handleSupernovaComplete = useCallback((projectId: string) => {
    setActiveSupernovas((prev) => prev.filter((id) => id !== projectId));
  }, []);

  // Track branch IDs that have collapsed into the main cluster
  const [collapsedBranchIds, setCollapsedBranchIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Branches that were already merged prior to current session are immediately collapsed
    (branches || []).forEach((b) => {
      if (b.mergedAt) {
        initial.add(b.id);
      }
    });
    return initial;
  });

  const handleCollapseComplete = useCallback((branchId: string) => {
    setCollapsedBranchIds((prev) => {
      const next = new Set(prev);
      next.add(branchId);
      return next;
    });
  }, []);

  // Filter non-default branches that should be rendered as orbiting moons
  const activeMoons = useMemo(() => {
    if (!branches) return [];
    return branches.filter((b) => !b.isDefault && !collapsedBranchIds.has(b.id));
  }, [branches, collapsedBranchIds]);

  const activeMoonBranchIds = useMemo(() => {
    return new Set(activeMoons.map((m) => m.id));
  }, [activeMoons]);

  // Separate commits: active branch commits trail their moon; others join the main cluster
  const { branchCommitsMap, mainCommits } = useMemo(() => {
    const map = new Map<string, GalaxyCommit[]>();
    const main: GalaxyCommit[] = [];

    commits.forEach((c) => {
      if (c.branchId && activeMoonBranchIds.has(c.branchId)) {
        const list = map.get(c.branchId) || [];
        list.push(c);
        map.set(c.branchId, list);
      } else {
        main.push(c);
      }
    });

    return { branchCommitsMap: map, mainCommits: main };
  }, [commits, activeMoonBranchIds]);

  // 1. Memoize Domain Model Instantiation via StarFactory so placement math
  // only recomputes when the underlying commits count or ids change.
  const { stars, clusters } = useMemo(() => {
    const total = mainCommits.length;
    const constructedStars = mainCommits.map((commit, index) =>
      StarFactory.fromCommit(commit, index, total, 45)
    );

    // Group into Cluster domain models
    const starMapByProject = new Map<string, Star[]>();
    mainCommits.forEach((commit, i) => {
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
  }, [mainCommits, projects]);

  // Track previous stars to detect newly ignited ones
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    const currentIds = new Set(stars.map((s) => s.id));
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousStarIdsRef.current = currentIds;
      return;
    }
    // Update ref after render cycle
    const timer = setTimeout(() => {
      previousStarIdsRef.current = currentIds;
    }, 1500);
    return () => clearTimeout(timer);
  }, [stars]);

  // 2. Build Continuous Constellation Edges (connecting ANY 2+ consecutive-day stars)
  const constellationEdges = useMemo(() => {
    const segments = buildConstellationChains(stars, mainCommits);
    return computeConstellationEdges(segments);
  }, [stars, mainCommits]);

  // Track previous connector edge IDs to trigger animated draw-in for newly formed filaments
  const previousEdgeIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentEdgeIds = new Set(constellationEdges.map((e) => e.id));
    if (isInitialMountRef.current) {
      previousEdgeIdsRef.current = currentEdgeIds;
      return;
    }
    const timer = setTimeout(() => {
      previousEdgeIdsRef.current = currentEdgeIds;
    }, 1500);
    return () => clearTimeout(timer);
  }, [constellationEdges]);

  const isLargeDataset = stars.length > INSTANCED_RENDERING_THRESHOLD;

  // The galaxy star placement radius matches the StarFactory.fromCommit() maxRadius arg
  const GALAXY_RADIUS = 45;

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [animationTarget, setAnimationTarget] = useState<CameraAnimationTarget | null>(null);

  const handleAnimationEnd = useCallback(() => {
    setAnimationTarget(null);
  }, []);

  // Locate the newest star by highest committedAt timestamp
  const latestStar = useMemo(() => {
    if (stars.length === 0 || mainCommits.length === 0) return null;
    let latestIdx = 0;
    let maxTime = -Infinity;
    mainCommits.forEach((c, idx) => {
      const time = new Date(c.committedAt).getTime();
      if (time > maxTime) {
        maxTime = time;
        latestIdx = idx;
      }
    });
    return stars[latestIdx] ?? null;
  }, [stars, mainCommits]);

  // 1. Reset View: returns camera to default [0, 20, 85] with target [0, 0, 0]
  const handleResetView = useCallback(() => {
    setAnimationTarget({
      id: Date.now(),
      targetPos: new THREE.Vector3(0, 20, 85),
      targetLookAt: new THREE.Vector3(0, 0, 0),
      duration: 0.8,
    });
    // Clear selection on reset
    setSelectedStarId(null);
    useGalaxyStore.getState().setPinnedStarId(null);
    useGalaxyStore.getState().setHoveredStarId(null);
  }, [setSelectedStarId]);

  // 2. Focus Latest Star: smoothly interpolates camera target to newest commit star
  const handleFocusLatestStar = useCallback(() => {
    if (!latestStar) return;
    const sx = latestStar.position.x;
    const sy = latestStar.position.y;
    const sz = latestStar.position.z;

    const dir = new THREE.Vector3(sx, sy, sz).normalize();
    if (dir.lengthSq() === 0) dir.set(0, 0, 1);

    const targetPos = new THREE.Vector3(sx, sy, sz)
      .add(dir.multiplyScalar(22))
      .add(new THREE.Vector3(0, 4, 0));

    setAnimationTarget({
      id: Date.now(),
      targetPos,
      targetLookAt: new THREE.Vector3(sx, sy, sz),
      duration: 0.8,
    });

    // Pin the star so the HUD tooltip opens with its details
    useGalaxyStore.getState().setPinnedStarId(latestStar.id);
  }, [latestStar]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-black">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 20, 85], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => {
          // Clear ALL selection state when clicking the canvas void
          setSelectedStarId(null);
          useGalaxyStore.getState().setPinnedStarId(null);
          useGalaxyStore.getState().setHoveredStarId(null);
        }}
      >
        {/* True black void */}
        <color attach="background" args={['#000000']} />

        {/* Cursor: pointer on star hover, default elsewhere */}
        <CursorManager />

        {/* Smooth camera animation interpolator (supports prefers-reduced-motion) */}
        <CameraAnimator
          controlsRef={controlsRef}
          animationTarget={animationTarget}
          onAnimationEnd={handleAnimationEnd}
        />

        {/* Neutral starlight only */}
        <ambientLight intensity={0.35} />
        <pointLight position={[100, 100, 100]} intensity={1.4} color="#ffffff" />

        {/* Deep cosmic background starfield (drei built-in) */}
        <DreiStars
          radius={200}
          depth={60}
          count={3000}
          factor={4}
          saturation={0.5}
          fade
          speed={0.5}
        />

        {/* Atmospheric depth cues: dust motes in a spherical shell beyond the stars */}
        <Atmosphere galaxyRadius={GALAXY_RADIUS} />

        {/* Interactive Galaxy Universe: renders stars and branch moons, or the embryonic ProtostarCore if 0 commits */}
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          {stars.length > 0 || activeMoons.length > 0 ? (
            <GalaxyWorld
              stars={stars}
              constellationEdges={constellationEdges}
              isLargeDataset={isLargeDataset}
              previousStarIdsRef={previousStarIdsRef}
              previousEdgeIdsRef={previousEdgeIdsRef}
              selectedStarId={selectedStarId}
              setSelectedStarId={setSelectedStarId}
              activeMoons={activeMoons}
              clusters={clusters}
              branchCommitsMap={branchCommitsMap}
              onCollapseComplete={handleCollapseComplete}
              releases={releases}
              activeSupernovas={activeSupernovas}
              onSupernovaComplete={handleSupernovaComplete}
              activeShootingStars={activeShootingStars}
              onShootingStarComplete={handleShootingStarComplete}
            />
          ) : (
            <ProtostarCore />
          )}
        </Float>

        {/* Orbit Controls with Damping and Ref */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={15}
          maxDistance={180}
          rotateSpeed={0.8}
        />

        {/* Post-processing: Bloom on emissive stars + edge vignette.
            Mounted last so it composites over everything above.
            Adapts quality automatically when starCount > 200. */}
        <BloomEffects starCount={stars.length} />
      </Canvas>

      {/* Genuine Empty State HUD overlay for zero commits / unignited galaxy */}
      {stars.length === 0 && activeMoons.length === 0 && (
        <ProtostarOverlay
          username={username || 'cosmonaut'}
          repoName={projects.length === 1 ? projects[0].repoName : null}
        />
      )}

      {/* Star HUD tooltip — lives outside Canvas as a normal DOM overlay (bottom-left) */}
      <StarTooltip commits={commits} projects={projects} branches={branches} />

      {/* Camera Controls — HTML overlay (bottom-right), zero overlap with stats or view switch */}
      <CameraControls
        onResetView={handleResetView}
        onFocusLatestStar={handleFocusLatestStar}
        hasLatestStar={Boolean(latestStar)}
      />
    </div>
  );
}
export default GalaxyScene;
