/**
 * ==============================================================================
 * Deterministic Star Color Mapping by Programming Language
 * ==============================================================================
 * In CommitCosmos, each commit illuminates a 3D star. The star's spectral color
 * is deterministically derived from the commit's primary programming language.
 *
 * Known languages map to curated celestial hues; unlisted languages fallback to
 * a deterministic hash-generated spectral palette.
 * ==============================================================================
 */

const LANGUAGE_COLOR_MAP: Record<string, string> = {
  typescript: '#38bdf8', // Nebula Cyan
  javascript: '#facc15', // Celestial Gold
  python: '#60a5fa', // Stellar Blue
  rust: '#fb923c', // Supernova Orange
  go: '#2dd4bf', // Pulsar Teal
  c: '#a855f7', // Deep Violet
  'c++': '#ec4899', // Cosmic Magenta
  'c#': '#818cf8', // Indigo Star
  java: '#f97316', // Solar Flare
  kotlin: '#c084fc', // Purple Giant
  swift: '#f87171', // Ruby Dwarf
  ruby: '#ef4444', // Red Supergiant
  php: '#9333ea', // Aurora Purple
  html: '#f43f5e', // Coral Star
  css: '#3b82f6', // Sapphire Blue
  scss: '#db2777', // Pink Dwarf
  sql: '#06b6d4', // Aqua Ray
  shell: '#4ade80', // Emerald Corona
  bash: '#22c55e', // Green Ray
  markdown: '#94a3b8', // Stardust Slate
  solidity: '#6366f1', // Quantum Indigo
};

const PALETTE_FALLBACKS = [
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#fb923c',
  '#facc15',
  '#2dd4bf',
  '#4ade80',
];

/**
 * Computes a deterministic integer hash from a string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a hex color code for a given programming language.
 * If the language is unknown or null, returns a deterministic cosmic hue.
 *
 * @param language - The repository or commit language name (e.g. 'TypeScript', 'python')
 * @returns Hex color string (e.g. '#38bdf8')
 */
export function getStarColorForLanguage(language: string | null | undefined): string {
  if (!language || !language.trim()) {
    // Default neutral celestial white-blue starlight for untyped/generic commits
    return '#e2e8f0';
  }

  const normalized = language.trim().toLowerCase();

  if (LANGUAGE_COLOR_MAP[normalized]) {
    return LANGUAGE_COLOR_MAP[normalized];
  }

  // Deterministic fallback based on string hash
  const index = hashString(normalized) % PALETTE_FALLBACKS.length;
  return PALETTE_FALLBACKS[index];
}
