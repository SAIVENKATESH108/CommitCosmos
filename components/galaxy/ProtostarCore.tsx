'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalaxyStore } from '@/lib/store';

/**
 * ProtostarCore: A dim, unlit embryonic star rendered at the galactic origin
 * for brand-new users or empty repository states.
 *
 * Visual & Narrative Semantics:
 * - Brightness near 0 (dormant core awaiting fusion ignition).
 * - Gentle, slow rhythmic breathing pulse (~3s cycle) signaling readiness.
 * - Surrounding nascent accretion disc and faint stellar dust ring.
 * - Strictly honors prefers-reduced-motion to avoid unwanted motion.
 */
export function ProtostarCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsedTimeRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  const { setHoveredStarId, setPinnedStarId } = useGalaxyStore();

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
      setHoveredStarId('protostar');
    },
    [setHoveredStarId]
  );

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    setHoveredStarId(null);
  }, [setHoveredStarId]);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setPinnedStarId('protostar');
    },
    [setPinnedStarId]
  );

  // Clear protostar selection on unmount
  useEffect(() => {
    return () => {
      setHoveredStarId(null);
      setPinnedStarId(null);
    };
  }, [setHoveredStarId, setPinnedStarId]);

  useFrame((_, delta) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Slow dormant rotation
    if (ringRef.current && !prefersReducedMotion) {
      ringRef.current.rotation.z += delta * 0.12;
    }

    // 2. Gentle stellar respiration / breathing pulse
    if (meshRef.current && materialRef.current) {
      if (prefersReducedMotion) {
        meshRef.current.scale.setScalar(1.0);
        materialRef.current.emissiveIntensity = hovered ? 0.35 : 0.2;
        return;
      }

      elapsedTimeRef.current += delta;
      const time = elapsedTimeRef.current;
      const pulse = Math.sin(time * 1.6) * 0.08;
      const baseScale = hovered ? 1.25 : 1.0;
      meshRef.current.scale.setScalar(baseScale + pulse * 0.4);

      const baseIntensity = hovered ? 0.45 : 0.22;
      materialRef.current.emissiveIntensity = baseIntensity + pulse * 0.12;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Dim, unlit protostar sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#1e1b4b"
          emissive="#6366f1"
          emissiveIntensity={0.22}
          roughness={0.75}
          metalness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Invisible, generous hit-target sphere for interaction */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Nascent accretion disc orbiting the unignited core */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <ringGeometry args={[2.4, 4.2, 64]} />
        <meshBasicMaterial
          color="#4f46e5"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Faint secondary dust boundary ring */}
      <mesh rotation={[Math.PI / 2.5, Math.PI / 8, 0]}>
        <ringGeometry args={[4.8, 5.2, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle local point light casting dim violet glow */}
      <pointLight color="#818cf8" intensity={0.5} distance={25} />
    </group>
  );
}
export default ProtostarCore;
