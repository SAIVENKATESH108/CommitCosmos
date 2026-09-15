# CommitCosmos

> Turn your GitHub commit history into an interactive 3D galaxy: every commit lights a star, every daily streak connects stars into a constellation.

Built for **First Commit &bull; Devpost Hackathon**.

## Architecture & Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark-first "Night Sky" cosmic theme)
- **Components**: shadcn/ui (New York style)
- **Animation & Motion**: Framer Motion
- **Icons**: Lucide React
- **State & Data**: Zustand & @tanstack/react-query
- **Database (Upcoming)**: Drizzle ORM + PostgreSQL

## Project Structure

```text
├── app/                  # Next.js App Router (pages, layout, cosmic theme)
├── components/
│   ├── ui/               # shadcn/ui design system primitives
│   └── galaxy/           # Interactive 3D scene & star constellation components
├── lib/                  # Shared utilities & helpers (cn, formatters)
├── db/                   # Drizzle ORM schema & repository data layer
└── doc/                  # Hackathon proposal & documentation
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the galaxy.

## Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Production build with static route generation
- `npm run start`: Run production build locally
- `npm run lint`: Run ESLint checks
