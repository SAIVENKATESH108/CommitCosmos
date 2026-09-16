'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface SupernovaEffectProps {
  centroid: { x: number; y: number; z: number };
  onComplete?: () => void;
  color?: string;
}

/**
 * ==============================================================================
 * SupernovaEffect Component
 * ==============================================================================
 * Renders an expansive celestial supernova shockwave upon a tagged release.
 *
 * Visual Features:
 * - High-energy core explosion sphere that expands and dissolves
 * - Expanding cosmic shockwave ring (radius 1 -> 36 units) with luminous starlight
 * - 16 radiating relativistic particle jets shooting outward from the centroid
 * - Smooth cubic ease-out deceleration curve over 1.7 seconds
 * - Strictly respects prefers-reduced-motion
 * ==============================================================================
 */
export function SupernovaEffect({
  centroid,
  onComplete,
  color = '#fbbf24',
}: SupernovaEffectProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const [phase, setPhase] = useState(0); // 0.0 -> 1.0
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 16 radiating relativistic spark ray vectors
  const sparkRayPoints = useMemo(() => {
    const rays: [number, number, number][][] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 24 + Math.random() * 8;
      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);
      rays.push([
        [0, 0, 0],
        [x, y, z],
      ]);
    }
    return rays;
  }, []);

  useFrame((_, delta) => {
    if (prefersReducedMotion) {
      // Instant gentle transition for accessibility
      onComplete?.();
      return;
    }

    const nextPhase = phase + delta * 0.65; // ~1.54s duration
    setPhase(nextPhase);

    if (nextPhase >= 1.0) {
      onComplete?.();
      return;
    }

    // Cubic ease-out expansion curve
    const t = nextPhase;
    const eased = 1 - Math.pow(1 - t, 3);

    // 1. Central core burst
    if (coreRef.current && coreMatRef.current) {
      const coreScale = 0.5 + eased * 12;
      coreRef.current.scale.setScalar(coreScale);
      coreMatRef.current.opacity = Math.max(0, 1.0 - t * 1.4);
    }

    // 2. Expanding shockwave ring
    if (ringRef.current && ringMatRef.current) {
      const ringScale = 1.0 + eased * 35;
      ringRef.current.scale.setScalar(ringScale);
      ringMatRef.current.opacity = Math.max(0, Math.sin(t * Math.PI) * 0.9);
    }
  });

  if (phase >= 1.0) return null;

  return (
    <group position={[centroid.x, centroid.y, centroid.z]}>
      {/* 1. Supernova Core Blast Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.0, 24, 24]} />
        <meshBasicMaterial
          ref={coreMatRef}
          color="#ffffff"
          transparent
          opacity={1.0}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Expanding Shockwave Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.0, 48]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Secondary Inclined Shockwave Ring for volumetric 3D spherical depth */}
      <mesh ref={ringRef} rotation={[0, Math.PI / 3, 0]}>
        <ringGeometry args={[0.92, 1.0, 48]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={Math.max(0, (1.0 - phase) * 0.6)}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Radiating spark rays */}
      {sparkRayPoints.map((pts, i) => {
        const scaledPts: [number, number, number][] = [
          pts[0],
          [
            pts[1][0] * (phase * 1.2),
            pts[1][1] * (phase * 1.2),
            pts[1][2] * (phase * 1.2),
          ],
        ];
        return (
          <Line
            key={i}
            points={scaledPts}
            color={i % 2 === 0 ? color : '#ffffff'}
            transparent
            opacity={Math.max(0, (1 - phase) * 0.7)}
            lineWidth={1.5}
          />
        );
      })}
    </group>
  );
}
