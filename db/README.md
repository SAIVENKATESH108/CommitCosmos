# Database & Data Access Layer

This directory is reserved for the Drizzle ORM schema, migrations, database connection client, and repository query functions for CommitCosmos.

## Planned Responsibilities

- **Schema Definitions**: Tables for users, GitHub accounts, synced repositories, cached commit records, constellation streaks, and user galaxy preferences.
- **Client Connection**: PostgreSQL client (Neon / Supabase / Postgres.js) connection pool configured via Drizzle ORM.
- **Repository Methods**: Type-safe query helpers to fetch commit histories, compute daily streak constellations, and manage user sessions.
