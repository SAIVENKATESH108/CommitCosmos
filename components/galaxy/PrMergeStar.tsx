'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Star } from '@/lib/galaxy/Star';
import { useGalaxyStore } from '@/lib/store';

interface PrMergeStarProps {
  star: Star;
  isNew: boolean;
  isSelected: boolean;
}

/**
 * ==============================================================================
 * PrMergeStar — Dual-Color Accretion-Disk Binary System
 * ==============================================================================
 * Visually distinguishes collaborative Pull Request merges from single solo commits.
 *
 * Visual representation:
 * 1. Two offset stellar lobes representing the two merging branches swirling
 *    around a common gravitational center (barycenter).
 *    - Primary lobe: The star's language spectral color (e.g., TS Blue, Rust Orange).
 *    - Secondary lobe: Complementary celestial companion color (#c084fc or #38bdf8).
 * 2. An equatorial luminous accretion disk / ring glowing around the shared center.
 * 3. Rotational swirling animation on useFrame (respects prefers-reduced-motion).
 * 4. Transparent hit-target sphere with non-depth-writing material for crisp
 *    pointer interaction.
 * ==============================================================================
 */
export function PrMergeStar({ star, isNew, isSelected }: PrMergeStarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitalGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const primaryMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const secondaryMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [ignitionPhase, setIgnitionPhase] = useState(isNew ? 0 : 1);
  const [localHovered, setLocalHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { setHoveredStarId, pinnedStarId, setPinnedStarId } = useGalaxyStore();

  // Detect OS prefers-reduced-motion setting
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Trigger domain ignite
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
      const next = pinnedStarId === star.id ? null : star.id;
      setPinnedStarId(next);
    },
    [star.id, pinnedStarId, setPinnedStarId]
  );

  // Swirl & pulse animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 1. Swirling rotation of dual lobes & accretion disks (unless user prefers reduced motion)
    if (!prefersReducedMotion) {
      if (orbitalGroupRef.current) {
        orbitalGroupRef.current.rotation.y += delta * 2.2;
      }
      if (ringRef.current) {
        ringRef.current.rotation.z += delta * 1.2;
      }
      if (outerRingRef.current) {
        outerRingRef.current.rotation.z -= delta * 0.8;
      }
    }

    // 2. Ignition birth curve or hover/select scale interpolation
    if (ignitionPhase < 1) {
      const nextPhase = Math.min(1, ignitionPhase + delta * 2.2);
      setIgnitionPhase(nextPhase);

      const overshoot = Math.sin(nextPhase * Math.PI) * 0.5;
      const currentScale = (nextPhase + overshoot) * star.sizeMultiplier;
      groupRef.current.scale.setScalar(currentScale);

      const flashIntensity = (2.0 + Math.sin(nextPhase * Math.PI) * 5.0) * star.brightnessMultiplier;
      if (primaryMatRef.current) primaryMatRef.current.emissiveIntensity = flashIntensity;
      if (secondaryMatRef.current) secondaryMatRef.current.emissiveIntensity = flashIntensity;
    } else {
      const baseScale = star.sizeMultiplier;
      const targetScale = isSelected ? baseScale * 1.6 : localHovered ? baseScale * 1.3 : baseScale;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 8
      );

      const baseIntensity = star.brightnessMultiplier;
      const targetIntensity = isSelected
        ? baseIntensity * 3.8
        : localHovered
        ? baseIntensity * 2.6
        : Math.max(1.1, star.brightness * 2.0 * baseIntensity);

      if (primaryMatRef.current) {
        primaryMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          primaryMatRef.current.emissiveIntensity,
          targetIntensity,
          delta * 6
        );
      }
      if (secondaryMatRef.current) {
        secondaryMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          secondaryMatRef.current.emissiveIntensity,
          targetIntensity * 0.95,
          delta * 6
        );
      }
    }
  });

  const primaryColor = useMemo(() => new THREE.Color(star.color), [star.color]);
  const companionColor = useMemo(
    () => new THREE.Color(star.secondaryColor || '#c084fc'),
    [star.secondaryColor]
  );
  const pos: [number, number, number] = [star.position.x, star.position.y, star.position.z];

  // Primary lobe is slightly larger, secondary companion is slightly smaller
  const primaryRadius = 0.48;
  const secondaryRadius = 0.42;
  const lobeOffset = 0.46;

  return (
    <group position={pos}>
      <group ref={groupRef}>
        {/* Swirling Binary Lobes Group */}
        <group ref={orbitalGroupRef}>
          {/* Primary Branch Star Core */}
          <mesh position={[lobeOffset, 0, 0]}>
            <sphereGeometry args={[primaryRadius, 16, 16]} />
            <meshStandardMaterial
              ref={primaryMatRef}
              color={primaryColor}
              emissive={primaryColor}
              emissiveIntensity={Math.max(1.1, star.brightness * 2.0 * star.brightnessMultiplier)}
              roughness={0.15}
              metalness={0.2}
            />
          </mesh>

          {/* Secondary Merged Branch Star Core (Swirling 180 degrees opposite) */}
          <mesh position={[-lobeOffset, 0, 0]}>
            <sphereGeometry args={[secondaryRadius, 16, 16]} />
            <meshStandardMaterial
              ref={secondaryMatRef}
              color={companionColor}
              emissive={companionColor}
              emissiveIntensity={Math.max(1.1, star.brightness * 2.0 * star.brightnessMultiplier)}
              roughness={0.15}
              metalness={0.2}
            />
          </mesh>
        </group>

        {/* Accretion Disk (Inner primary glow ring, tilted at 45 deg) */}
        <mesh ref={ringRef} rotation={[Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.65, 1.25, 32]} />
          <meshBasicMaterial
            color={companionColor}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Outer Accretion Wisps (Tilted counter-plane ring) */}
        <mesh ref={outerRingRef} rotation={[-Math.PI / 5, Math.PI / 6, 0]}>
          <ringGeometry args={[1.2, 1.55, 32]} />
          <meshBasicMaterial
            color={primaryColor}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Invisible Hit-Target Sphere (Encompasses both lobes and accretion disk for effortless clicking/tapping) */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        renderOrder={1}
      >
        <sphereGeometry args={[1.7 * star.sizeMultiplier, 8, 8]} />
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
