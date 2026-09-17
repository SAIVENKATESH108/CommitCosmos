'use client';

/**
 * Deterministic star field — positions seeded by index to prevent SSR/hydration mismatch.
 * Rendered client-side only.
 */

// Simple deterministic pseudo-random from a seed
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface StarFieldProps {
  count?: number;
}

export function StarField({ count = 60 }: StarFieldProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const size = seededRandom(i * 3) * 2 + 0.8;
        const top = seededRandom(i * 7) * 100;
        const left = seededRandom(i * 11) * 100;
        const delay = seededRandom(i * 13) * 5;
        const opacity = seededRandom(i * 17) * 0.55 + 0.1;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: size + 'px',
              height: size + 'px',
              top: top + '%',
              left: left + '%',
              animationDelay: delay + 's',
              opacity,
            }}
          />
        );
      })}
    </>
  );
}
