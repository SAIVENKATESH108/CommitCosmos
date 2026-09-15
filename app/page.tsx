export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Subtle cosmic background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          First Commit &bull; Devpost
        </div>

        <h1 className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
          CommitCosmos
        </h1>

        <p className="max-w-md text-sm text-slate-400 sm:text-base">
          Transform your GitHub commit history into an interactive 3D galaxy of
          stars and constellations.
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono">
            Next.js 14 App Router
          </span>
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono">
            TypeScript Strict
          </span>
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 font-mono">
            Tailwind CSS
          </span>
        </div>
      </div>
    </main>
  );
}
