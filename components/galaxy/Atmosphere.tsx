'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Points, PointMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AtmosphereProps {
  /**
   * The maximum radius of the outermost stars in the galaxy.
   * Atmosphere particles are distributed in a shell beyond this,
   * so they read as background void-dust rather than foreground clutter.
   */
  galaxyRadius?: number;
}

/**
 * ==============================================================================
 * Atmosphere — Cosmic Dust Particle Field
 * ==============================================================================
 * Renders ~1,500 muted blue-white dust motes in a thick spherical shell around
 * the galaxy to provide depth cues and make the void feel three-dimensional.
 *
 * Design constraints:
 *  - Outer shell: 1.1x–2.0x galaxyRadius → reads as deep background, not clutter
 *  - Color: muted blue-white (#b8c9e8 at low opacity) — complements star colors
 *    without competing with them and stays invisible against the black background
 *    until the camera gets close
 *  - Very slow rotation (Y-axis, 0.015 rad/s) adds perceived depth via parallax
 *  - Respects prefers-reduced-motion: skips animation entirely if requested,
 *    matching how GalaxyWorld's auto-rotation already works
 * ==============================================================================
 */
export function Atmosphere({ galaxyRadius = 45 }: AtmosphereProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Mirror GalaxyWorld's reduced-motion check so behaviour is consistent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /**
   * Generate 1,500 points distributed uniformly in a spherical shell.
   *   inner radius = galaxyRadius x 1.1   (just beyond the outermost stars)
   *   outer radius = galaxyRadius x 2.0   (deep void background)
   *
   * Rejection sampling gives true spherical uniformity rather than
   * cube-mapping which would cluster points at corners.
   */
  const positions = useMemo<Float32Array>(() => {
    const COUNT = 1500;
    const arr = new Float32Array(COUNT * 3);
    const innerR = galaxyRadius * 1.1;
    const outerR = galaxyRadius * 2.0;

    let i = 0;
    while (i < COUNT) {
      const x = (Math.random() * 2 - 1) * outerR;
      const y = (Math.random() * 2 - 1) * outerR;
      const z = (Math.random() * 2 - 1) * outerR;
      const dist = Math.sqrt(x * x + y * y + z * z);
      // Accept only points within the shell
      if (dist >= innerR && dist <= outerR) {
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
        i++;
      }
    }
    return arr;
  }, [galaxyRadius]);

  // Very slow Y-axis rotation — far slower than star galaxy rotation (0.04 rad/s)
  // so the depth parallax is perceptible but not distracting
  useFrame((_, delta) => {
    if (pointsRef.current && !prefersReducedMotion) {
      pointsRef.current.rotation.y += delta * 0.015;
      pointsRef.current.rotation.x += delta * 0.004;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#b8c9e8"
        size={0.28}
        sizeAttenuation
        depthWrite={false}
        opacity={0.32}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}
