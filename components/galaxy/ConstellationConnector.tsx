'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ConstellationEdge } from '@/lib/galaxy/Constellation';

interface ConstellationConnectorProps {
  edge: ConstellationEdge;
  isNew?: boolean;
}

/**
 * ==============================================================================
 * ConstellationConnector Component
 * ==============================================================================
 * Renders an interactive 3D constellation filament connecting consecutive-day stars.
 *
 * Visual & Kinetic Features:
 * 1. Continuous Progression: Opacity & width scale with streak progress (2 to 7+ days).
 * 2. Animated Draw-in: When a new connector appears, the starlight beam smoothly
 *    draws itself from the origin star to the destination star (~0.7s) instead of
 *    popping in abruptly.
 * 3. Accessibility: Strictly checks and respects `prefers-reduced-motion` — if active,
 *    snaps immediately to full length with zero motion.
 * 4. Completion Glow: 7+ day completed constellations receive brilliant incandescent
 *    treatment with a gentle breathing pulse.
 * ==============================================================================
 */
export function ConstellationConnector({ edge, isNew = false }: ConstellationConnectorProps) {
  const p1 = useMemo(
    () => new THREE.Vector3(...edge.startPoint),
    [edge.startPoint]
  );
  const p2 = useMemo(
    () => new THREE.Vector3(...edge.endPoint),
    [edge.endPoint]
  );

  const progressRef = useRef(isNew ? 0 : 1);
  const currentEndRef = useRef(isNew ? p1.clone() : p2.clone());
  const [points, setPoints] = useState<[number, number, number][]>(() =>
    isNew ? [edge.startPoint, edge.startPoint] : [edge.startPoint, edge.endPoint]
  );

  const [currentOpacity, setCurrentOpacity] = useState(
    isNew ? 0 : edge.opacity
  );

  useFrame((state, delta) => {
    // 1. Draw-in animation for new connector lines
    if (progressRef.current < 1) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        progressRef.current = 1;
        setPoints([edge.startPoint, edge.endPoint]);
        setCurrentOpacity(edge.opacity);
        return;
      }

      // Smooth progress increment (~0.7s duration)
      progressRef.current = Math.min(1, progressRef.current + delta * 1.5);

      // Natural cubic ease-out curve
      const t = progressRef.current;
      const eased = 1 - Math.pow(1 - t, 3);

      currentEndRef.current.lerpVectors(p1, p2, eased);

      setPoints([
        edge.startPoint,
        [currentEndRef.current.x, currentEndRef.current.y, currentEndRef.current.z],
      ]);

      // Opacity fades in alongside draw-in, with slight surge at connection
      const opacityMultiplier = Math.min(1, t * 1.3);
      setCurrentOpacity(edge.opacity * opacityMultiplier);
    } else if (edge.isComplete) {
      // 2. Subtle celestial pulse for 7-day completed constellations
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 2.0) * 0.08;
        setCurrentOpacity(Math.min(1, edge.opacity + pulse));
      }
    }
  });

  return (
    <group>
      <Line
        points={points}
        color={edge.color}
        lineWidth={edge.lineWidth}
        transparent
        opacity={currentOpacity}
      />
    </group>
  );
}

export default ConstellationConnector;
