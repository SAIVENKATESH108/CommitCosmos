'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { GalaxyBranch, GalaxyCommit } from '@/lib/queries';
import { getStarColorForLanguage } from '@/lib/starColors';
import { useGalaxyStore } from '@/lib/store';

interface BranchMoonProps {
  branch: GalaxyBranch;
  centroid: { x: number; y: number; z: number };
  commits: GalaxyCommit[];
  orbitIndex: number;
  onCollapseComplete?: (branchId: string) => void;
}

/**
 * ==============================================================================
 * BranchMoon Component
 * ==============================================================================
 * Renders a non-default Git branch as a subtle celestial moon orbiting its
 * repository's cluster centroid.
 *
 * Features:
 * - Deterministic, non-overlapping orbital radius and inclined plane per branch
 * - Mini star-trail of commits trailing behind the moon with spectral colors
 * - Faint orbital guide path indicating trajectory without visual clutter
 * - Smooth inward collapse animation with an ignition flare when merged_at is set
 * - Full inspection interactivity: hover or click on moon or trail stars
 * - Respects prefers-reduced-motion
 * ==============================================================================
 */
export function BranchMoon({
  branch,
  centroid,
  commits,
  orbitIndex,
  onCollapseComplete,
}: BranchMoonProps) {
  const moonMeshRef = useRef<THREE.Group>(null);
  const moonMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flareMeshRef = useRef<THREE.Mesh>(null);
  const flareMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const [hovered, setHovered] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(Boolean(branch.mergedAt));
  const [collapsePhase, setCollapsePhase] = useState(0); // 0 -> 1 (collapse), 1 -> 1.5 (flare)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { setHoveredStarId, pinnedStarId, setPinnedStarId } = useGalaxyStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // When mergedAt changes from null to a date, initiate collapse
  useEffect(() => {
    if (branch.mergedAt) {
      setIsCollapsing(true);
    }
  }, [branch.mergedAt]);

  // Deterministic orbital parameters based on orbitIndex and branch name
  const { orbitRadius, tiltX, tiltZ, baseSpeed, startAngle } = useMemo(() => {
    const radius = 11 + orbitIndex * 3.8;
    // Derive stable inclination angles from branch name character codes
    let hash = 0;
    for (let i = 0; i < branch.branchName.length; i++) {
      hash = (hash << 5) - hash + branch.branchName.charCodeAt(i);
      hash |= 0;
    }
    const angleOffset = Math.abs(hash % 360) * (Math.PI / 180);
    const tiltAmount = 0.22 + (Math.abs(hash % 10) / 10) * 0.15;

    return {
      orbitRadius: radius,
      tiltX: Math.sin(angleOffset) * tiltAmount,
      tiltZ: Math.cos(angleOffset) * tiltAmount,
      baseSpeed: 0.22 / Math.sqrt(radius / 11),
      startAngle: angleOffset,
    };
  }, [orbitIndex, branch.branchName]);

  // Precompute circle points for the faint orbital guide path
  const orbitPathPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * orbitRadius;
      const z = Math.sin(theta) * orbitRadius;
      const y = x * tiltX + z * tiltZ;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, [orbitRadius, tiltX, tiltZ]);

  const angleRef = useRef(startAngle);
  const currentPosRef = useRef(new THREE.Vector3());
  const collapseStartPosRef = useRef<THREE.Vector3 | null>(null);

  // Per-frame animation: orbiting or inward collapse lerp + ignition flare
  useFrame((_, delta) => {
    if (!prefersReducedMotion && !isCollapsing) {
      angleRef.current += delta * baseSpeed;
    }

    const currentAngle = angleRef.current;
    const orbitX = Math.cos(currentAngle) * orbitRadius;
    const orbitZ = Math.sin(currentAngle) * orbitRadius;
    const orbitY = orbitX * tiltX + orbitZ * tiltZ;

    if (!isCollapsing) {
      currentPosRef.current.set(
        centroid.x + orbitX,
        centroid.y + orbitY,
        centroid.z + orbitZ
      );
      if (moonMeshRef.current) {
        moonMeshRef.current.position.copy(currentPosRef.current);
      }
      return;
    }

    // ============================================================================
    // Merged Branch Collapse & Ignition Flare Animation
    // ============================================================================
    if (collapseStartPosRef.current === null) {
      collapseStartPosRef.current = currentPosRef.current.clone();
      if (collapseStartPosRef.current.lengthSq() === 0) {
        collapseStartPosRef.current.set(
          centroid.x + orbitX,
          centroid.y + orbitY,
          centroid.z + orbitZ
        );
      }
    }

    if (prefersReducedMotion) {
      // Instant collapse for reduced motion
      onCollapseComplete?.(branch.id);
      return;
    }

    const nextPhase = collapsePhase + delta * 0.9;
    setCollapsePhase(nextPhase);

    if (nextPhase <= 1.0) {
      // Phase 1: Inward cubic ease-in collapse to cluster centroid (1.1s)
      const t = nextPhase;
      const eased = t * t * t; // Accelerate toward gravitational center
      currentPosRef.current.lerpVectors(
        collapseStartPosRef.current,
        new THREE.Vector3(centroid.x, centroid.y, centroid.z),
        eased
      );
      if (moonMeshRef.current) {
        moonMeshRef.current.position.copy(currentPosRef.current);
        const shrink = Math.max(0.01, 1 - eased * 0.6);
        moonMeshRef.current.scale.setScalar(shrink);
      }
    } else if (nextPhase <= 1.45) {
      // Phase 2: High-energy ignition flare at centroid upon merger arrival (0.45s)
      const flareProgress = (nextPhase - 1.0) / 0.45;
      if (flareMeshRef.current && flareMatRef.current) {
        const flareScale = 0.2 + flareProgress * 4.2;
        flareMeshRef.current.scale.setScalar(flareScale);
        flareMatRef.current.opacity = Math.max(0, 1.0 - flareProgress);
      }
      if (moonMeshRef.current) {
        moonMeshRef.current.visible = false;
      }
    } else {
      // Finished collapsing
      onCollapseComplete?.(branch.id);
    }
  });

  // Calculate mini star-trail positions along the orbital arc behind the moon
  const trailStars = useMemo(() => {
    return commits.map((commit, idx) => {
      const color = getStarColorForLanguage(commit.language);
      const angleOffset = -(idx + 1) * 0.11; // trailing backwards in radians
      return {
        commit,
        color,
        angleOffset,
      };
    });
  }, [commits]);

  // Trail connector line points
  const trailLinePoints = useMemo(() => {
    if (trailStars.length === 0) return [];
    const pts: [number, number, number][] = [[0, 0, 0]];
    trailStars.forEach((ts) => {
      const theta = ts.angleOffset;
      const x = Math.cos(theta) * orbitRadius - orbitRadius;
      const z = Math.sin(theta) * orbitRadius;
      const y = x * tiltX + z * tiltZ;
      pts.push([x, y, z]);
    });
    return pts;
  }, [trailStars, orbitRadius, tiltX, tiltZ]);

  const handleMoonClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (commits.length > 0) {
        // Pin the latest commit on this branch
        const latestCommit = commits[0];
        setPinnedStarId(pinnedStarId === latestCommit.id ? null : latestCommit.id);
      }
    },
    [commits, pinnedStarId, setPinnedStarId]
  );

  return (
    <group>
      {/* 1. Subtle, delicate orbital guide ring around centroid (hidden while collapsing) */}
      {!isCollapsing && (
        <group position={[centroid.x, centroid.y, centroid.z]}>
          <Line
            points={orbitPathPoints}
            color="#38bdf8"
            transparent
            opacity={0.11}
            lineWidth={1}
          />
        </group>
      )}

      {/* 2. Orbiting Moon Mesh with subtle glow & invisible hit-target */}
      <group ref={moonMeshRef}>
        {/* Visible Moon sphere: subtle slate-cyan, 0.35 radius */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            ref={moonMatRef}
            color="#7dd3fc"
            emissive="#38bdf8"
            emissiveIntensity={hovered ? 1.6 : 0.75}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>

        {/* Invisible hit target for moon (radius 0.9) */}
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            if (commits.length > 0) {
              setHoveredStarId(commits[0].id);
            }
          }}
          onPointerOut={() => {
            setHovered(false);
            setHoveredStarId(null);
          }}
          onClick={handleMoonClick}
        >
          <sphereGeometry args={[0.9, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* 3. Mini Star-Trail of Commits made on this branch */}
        {!isCollapsing &&
          trailStars.map(({ commit, color, angleOffset }) => {
            // Position relative to the moon
            const relAngle = angleOffset;
            const x = Math.cos(relAngle) * orbitRadius - orbitRadius;
            const z = Math.sin(relAngle) * orbitRadius;
            const y = x * tiltX + z * tiltZ;

            return (
              <group key={commit.id} position={[x, y, z]}>
                {/* Mini commit star sphere (0.22 radius) */}
                <mesh>
                  <sphereGeometry args={[0.22, 12, 12]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.8}
                    roughness={0.3}
                  />
                </mesh>

                {/* Hit-target for inspecting trail star */}
                <mesh
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredStarId(commit.id);
                  }}
                  onPointerOut={() => setHoveredStarId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedStarId(pinnedStarId === commit.id ? null : commit.id);
                  }}
                >
                  <sphereGeometry args={[0.65, 6, 6]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
              </group>
            );
          })}

        {/* 4. Faint trailing line filament connecting moon to its trail commits */}
        {!isCollapsing && trailLinePoints.length > 1 && (
          <Line
            points={trailLinePoints}
            color="#38bdf8"
            transparent
            opacity={0.22}
            lineWidth={1}
          />
        )}
      </group>

      {/* 5. Ignition Flare at cluster centroid when merged_at collapses */}
      {isCollapsing && (
        <mesh
          ref={flareMeshRef}
          position={[centroid.x, centroid.y, centroid.z]}
        >
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial
            ref={flareMatRef}
            color="#38bdf8"
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
