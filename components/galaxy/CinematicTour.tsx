'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGalaxyStore } from '@/lib/store';

interface CinematicTourProps {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

/**
 * ==============================================================================
 * CinematicTour Component
 * ==============================================================================
 * Renders an autonomous, choreographed camera fly-through of the 3D galaxy.
 *
 * Choreography:
 * - Sweeps smoothly along a 3D orbital curve around the galaxy.
 * - Dynamic altitude oscillation dipping towards star clusters and pulling back
 *   for majestic wide angles.
 * - Damped target lerping centered around the glowing protostar core.
 * - Auto-exits on user interaction (Escape key, mouse drag, touch).
 * ==============================================================================
 */
export function CinematicTour({ controlsRef }: CinematicTourProps) {
  const { camera, gl } = useThree();
  const { isCinematicTour, setIsCinematicTour } = useGalaxyStore();
  const elapsedRef = useRef(0);
  const targetPosRef = useRef(new THREE.Vector3());
  const targetLookAtRef = useRef(new THREE.Vector3());

  // Listen for Escape key or manual canvas interaction to gracefully exit
  useEffect(() => {
    if (!isCinematicTour) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCinematicTour(false);
      }
    };

    const domElement = gl.domElement;
    const handlePointerDown = (e: PointerEvent) => {
      // Small delay or primary click check to prevent instant exit on the toggle click
      if (e.isPrimary) {
        setIsCinematicTour(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isCinematicTour, setIsCinematicTour, gl.domElement]);

  useFrame((_, delta) => {
    if (!isCinematicTour) return;

    // Check OS prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsCinematicTour(false);
      return;
    }

    elapsedRef.current += delta;
    const t = elapsedRef.current * 0.14;

    // Majestic multi-frequency orbital spline
    const radius = 62 + Math.sin(t * 1.6) * 16;
    const height = 20 + Math.sin(t * 2.2) * 12;
    const x = Math.sin(t) * radius;
    const z = Math.cos(t) * radius;

    targetPosRef.current.set(x, height, z);

    // Subtle drifting focal point near the core & major constellations
    const lookX = Math.sin(t * 0.7) * 4.5;
    const lookY = Math.cos(t * 0.9) * 3.5;
    const lookZ = Math.sin(t * 0.5) * 4.5;
    targetLookAtRef.current.set(lookX, lookY, lookZ);

    // Silky lerp interpolation for camera position
    camera.position.lerp(targetPosRef.current, Math.min(1, delta * 2.5));

    // Smooth lerp for OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAtRef.current, Math.min(1, delta * 2.5));
      controlsRef.current.update();
    }
  });

  return null;
}
