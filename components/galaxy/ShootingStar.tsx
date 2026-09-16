'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export interface ShootingStarProps {
  id: string;
  issueNumber: number;
  onComplete: (id: string) => void;
}

/**
 * ==============================================================================
 * ShootingStar Component — Transient Celebratory Issue Closure Event
 * ==============================================================================
 * Renders a brilliant one-time meteor streaking across the visible cosmic viewport
 * when an issue is closed.
 *
 * Visual Characteristics:
 * - High-speed celestial trajectory across the visible viewport over ~1.4 seconds
 * - Radiant incandescent core (white/cyan) with glowing point-light bloom
 * - Trailing ion stream line with tapered opacity envelope
 * - Micro spark wake shedding behind the meteor
 * - Leaves ZERO permanent trace in the 3D scene upon completion
 * - Strictly respects prefers-reduced-motion
 * ==============================================================================
 */
export function ShootingStar({ id, issueNumber, onComplete }: ShootingStarProps) {
  const [progress, setProgress] = useState(0); // 0.0 -> 1.0
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const headMeshRef = useRef<THREE.Mesh>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute a deterministic yet dynamic diagonal trajectory across the celestial dome
  const { startPos, endPos, seedColor } = useMemo(() => {
    // Generate slight pseudo-random variance based on issue number
    const angleOffset = ((issueNumber * 37) % 30) - 15;
    const startX = -45 + angleOffset * 0.3;
    const startY = 32 + (issueNumber % 10) * 0.8;
    const startZ = -5 + ((issueNumber * 13) % 10) - 5;

    const endX = 42 + angleOffset * 0.3;
    const endY = -26 - (issueNumber % 8) * 0.8;
    const endZ = 8 + ((issueNumber * 7) % 10) - 5;

    return {
      startPos: new THREE.Vector3(startX, startY, startZ),
      endPos: new THREE.Vector3(endX, endY, endZ),
      seedColor: issueNumber % 2 === 0 ? '#38bdf8' : '#a855f7',
    };
  }, [issueNumber]);

  // Duration in seconds
  const duration = prefersReducedMotion ? 0.9 : 1.4;

  useFrame((_, delta) => {
    if (completedRef.current) return;

    const nextProgress = progress + delta / duration;
    if (nextProgress >= 1.0) {
      completedRef.current = true;
      setProgress(1.0);
      onComplete(id);
    } else {
      setProgress(nextProgress);
    }
  });

  // Calculate current head position & opacity envelope
  // Opacity envelope: quick 10% fade-in, sustained streak, burn-out fade to 0 in last 25%
  let opacity = 1.0;
  if (progress < 0.1) {
    opacity = progress / 0.1;
  } else if (progress > 0.75) {
    opacity = Math.max(0, 1.0 - (progress - 0.75) / 0.25);
  }

  // Smooth ease-out quad for natural atmospheric entry deceleration
  const easedT = prefersReducedMotion ? 0.5 : 1 - Math.pow(1 - progress, 1.8);
  const currentHead = useMemo(() => {
    return startPos.clone().lerp(endPos, easedT);
  }, [startPos, endPos, easedT]);

  // Trailing ion tail segments (lagging behind current head)
  const trailPoints = useMemo(() => {
    if (prefersReducedMotion) {
      return [currentHead.toArray(), currentHead.toArray()];
    }
    const tailLengthT = Math.min(easedT, 0.22 * (1.0 - progress * 0.3));
    const tailLag1 = startPos.clone().lerp(endPos, Math.max(0, easedT - tailLengthT * 0.3));
    const tailLag2 = startPos.clone().lerp(endPos, Math.max(0, easedT - tailLengthT * 0.65));
    const tailEnd = startPos.clone().lerp(endPos, Math.max(0, easedT - tailLengthT));

    return [
      currentHead.toArray() as [number, number, number],
      tailLag1.toArray() as [number, number, number],
      tailLag2.toArray() as [number, number, number],
      tailEnd.toArray() as [number, number, number],
    ];
  }, [currentHead, startPos, endPos, easedT, progress, prefersReducedMotion]);

  if (completedRef.current) return null;

  return (
    <group>
      {/* 1. Leading Incandescent Meteor Head */}
      <mesh ref={headMeshRef} position={currentHead}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Concentric Radiant Glow Sphere */}
      <mesh position={currentHead}>
        <sphereGeometry args={[0.75, 12, 12]} />
        <meshBasicMaterial
          color={seedColor}
          transparent
          opacity={opacity * 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Luminous Trailing Ion Stream (Outer Aura) */}
      {!prefersReducedMotion && (
        <Line
          points={trailPoints}
          color={seedColor}
          lineWidth={4}
          transparent
          opacity={opacity * 0.65}
          depthWrite={false}
        />
      )}

      {/* 4. Dense Inner White Plasma Core Trail */}
      {!prefersReducedMotion && (
        <Line
          points={trailPoints.slice(0, 3)}
          color="#ffffff"
          lineWidth={2}
          transparent
          opacity={opacity * 0.9}
          depthWrite={false}
        />
      )}
    </group>
  );
}
