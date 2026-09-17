'use client';

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ConstellationEdge } from '@/lib/galaxy/Constellation';

interface ConstellationConnectorProps {
  edge: ConstellationEdge;
  isNew?: boolean;
}

/**
 * ConstellationConnector Component
 * Renders an interactive 3D constellation filament connecting stars into glowing constellations.
 */
export function ConstellationConnector({ edge }: ConstellationConnectorProps) {
  const points = useMemo<[[number, number, number], [number, number, number]]>(
    () => [edge.startPoint, edge.endPoint],
    [edge.startPoint, edge.endPoint]
  );

  return (
    <group>
      <Line
        points={points}
        color={edge.color || '#a78bfa'}
        lineWidth={Math.max(2.0, (edge.lineWidth || 2.0) * 1.5)}
        transparent
        opacity={Math.max(0.65, edge.opacity || 0.75)}
      />
    </group>
  );
}

export default ConstellationConnector;
