'use client';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface BloomEffectsProps {
  /**
   * Number of stars currently rendered.
   * Above INSTANCED_RENDERING_THRESHOLD (200) we switch to a lower-resolution
   * bloom pass to keep the frame budget under 16.6ms on integrated graphics.
   */
  starCount: number;
}

/**
 * ==============================================================================
 * BloomEffects — Post-Processing Pass
 * ==============================================================================
 * Mounts as the last child inside the R3F <Canvas> so it composites over every
 * mesh rendered before it.
 *
 * Bloom calibration notes:
 *  - Stars use MeshStandardMaterial with emissiveIntensity 0.9–3.5 (idle → hover).
 *  - luminanceThreshold=0.18 means the pass activates on any pixel whose
 *    luminance exceeds 18% white — this reliably catches emissiveIntensity >= 1.0
 *    (the idle default of 0.9 * base brightness typically peaks around 0.2–0.4
 *    on-screen luminance, so those subtly glow; hover/selected stars at 2.5–3.5
 *    blow out into a satisfying bloom halo).
 *  - luminanceSmoothing=0.9 softens the knee so the transition from "no glow"
 *    to "full bloom" isn't a harsh threshold edge on mid-brightness stars.
 *  - mipmapBlur=true uses the built-in mipmap blur chain (faster than a custom
 *    kernel on WebGL 2, compatible with R3F/drei on Three.js >= 0.138).
 *
 * Performance degradation strategy (per spec):
 *  - starCount <= 200 (individual meshes):   full quality, intensity 0.9, resolution 256
 *  - starCount > 200  (InstancedMesh cloud): reduced intensity 0.6, resolution 128
 *    Bloom resolution is measured in pixels of the internal blur target; halving it
 *    cuts the blur pass cost ~4x with minimal visible difference on the larger cloud.
 *
 * Vignette:
 *  - Darkens screen edges to draw focus toward the galaxy centre.
 *  - Very subtle (offset 0.5, darkness 0.6) — just enough to add cinematic depth
 *    without making the UI look old-school/distorted.
 *  - Uses NORMAL blend function so it composites cleanly onto the black background.
 * ==============================================================================
 */
export function BloomEffects({ starCount }: BloomEffectsProps) {
  const isLargeDataset = starCount > 200;

  // Performance-conditional bloom quality
  const bloomIntensity = isLargeDataset ? 0.6 : 0.9;
  const bloomMipmapBlur = true; // faster on WebGL 2, consistent on all platforms

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.9}
        mipmapBlur={bloomMipmapBlur}
        // Reduce internal blur render target resolution for large star counts
        resolutionScale={isLargeDataset ? 0.5 : 1.0}
      />
      <Vignette
        offset={0.5}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
