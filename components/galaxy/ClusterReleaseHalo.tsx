'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GalaxyRelease } from '@/lib/queries';

interface ClusterReleaseHaloProps {
  centroid: { x: number; y: number; z: number };
  releases: GalaxyRelease[];
  radius?: number;
}

/**
 * ==============================================================================
 * ClusterReleaseHalo Component
 * ==============================================================================
 * Permanent celebratory celestial marker rendered around the cluster centroid
 * of any repository with at least one tagged release.
 *
 * Visual Features:
 * - Subtle incandescent golden halo ring encircling the repository stars
 * - Gentle sinusoidal breathing pulse (opacity 0.22 -> 0.38)
 * - Slow cosmic axial drift
 * - Miniature golden release diamond marker on the perimeter with hover tooltip
 * - Respects prefers-reduced-motion
 * ==============================================================================
 */
export function ClusterReleaseHalo({
  centroid,
  releases,
  radius = 14.5,
}: ClusterReleaseHaloProps) {
  const groupRef = useRef<THREE.Group>(null);
  const diamondMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Precompute circle points for the golden celestial halo
  const haloPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
    }
    return pts;
  }, [radius]);

  const [opacity, setOpacity] = useState(0.28);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(timeRef.current * 0.4) * 0.08;
    }

    // Subtle breathing luminosity
    const breath = 0.26 + Math.sin(timeRef.current * 1.8) * 0.09;
    setOpacity(hovered ? 0.65 : breath);

    if (diamondMatRef.current) {
      diamondMatRef.current.emissiveIntensity = hovered ? 2.5 : 1.2 + Math.sin(timeRef.current * 2.0) * 0.4;
    }
  });

  const latestRelease = releases[0];

  return (
    <group position={[centroid.x, centroid.y, centroid.z]}>
      <group ref={groupRef}>
        {/* 1. Permanent Glowing Golden Halo Ring */}
        <Line
          points={haloPoints}
          color="#fbbf24"
          transparent
          opacity={opacity}
          lineWidth={1.3}
        />

        {/* 2. Secondary Faint Violet Ring providing chromatic cosmic depth */}
        <Line
          points={haloPoints}
          color="#c084fc"
          transparent
          opacity={opacity * 0.4}
          lineWidth={0.9}
        />

        {/* 3. Golden Release Diamond Milestone Marker at [radius, 0, 0] */}
        <group position={[radius, 0, 0]}>
          {/* Visible Diamond Gem (Octahedron) */}
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            <octahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial
              ref={diamondMatRef}
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.4}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>

          {/* Invisible Hit-Target */}
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Tooltip on hover */}
          {hovered && latestRelease && (
            <Html distanceFactor={45} position={[0, 0.7, 0]} center>
              <div className="pointer-events-none select-none px-2 py-1 rounded-md bg-black/90 border border-amber-500/40 text-amber-300 text-[11px] font-mono shadow-xl whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-semibold text-white">Release {latestRelease.tagName}</span>
                {releases.length > 1 && (
                  <span className="text-amber-400/80">({releases.length} tags)</span>
                )}
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}
