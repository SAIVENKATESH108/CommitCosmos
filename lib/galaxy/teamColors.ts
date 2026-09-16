/**
 * ==============================================================================
 * Team Member Chromatic Palette
 * ==============================================================================
 * Curated high-contrast celestial color palette assigned to team collaborators.
 * Distinct from the language-based spectral colors, allowing each contributor's
 * commits to render as a distinct multi-author planetary/star system.
 * ==============================================================================
 */

export const TEAM_MEMBER_PALETTE: readonly string[] = [
  '#f43f5e', // 1. Electric Rose / Coral
  '#38bdf8', // 2. Sky Cyan
  '#a855f7', // 3. Cosmic Violet
  '#10b981', // 4. Emerald Flare
  '#f59e0b', // 5. Solar Amber
  '#ec4899', // 6. Nebula Magenta
  '#84cc16', // 7. Aurora Lime
  '#06b6d4', // 8. Deep Teal
  '#818cf8', // 9. Quantum Indigo
  '#fb923c', // 10. Solar Flare Orange
];

/**
 * Returns a deterministic color for a team member based on their index or username.
 */
export function getTeamMemberColor(username?: string | null, index?: number): string {
  if (index !== undefined && index >= 0) {
    return TEAM_MEMBER_PALETTE[index % TEAM_MEMBER_PALETTE.length];
  }

  if (!username) {
    return TEAM_MEMBER_PALETTE[0];
  }

  // Deterministic hash on username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }

  const idx = Math.abs(hash) % TEAM_MEMBER_PALETTE.length;
  return TEAM_MEMBER_PALETTE[idx];
}
