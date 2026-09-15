# Repository Pattern in CommitCosmos

The **Repository Pattern** acts as a mediating boundary between the application domain (API routes, server actions, and frontend components) and the underlying Drizzle ORM database layer. Instead of scattering raw SQL and Drizzle queries across endpoint handlers, all database access is encapsulated behind clean, strongly typed, single-purpose functions.

We chose this pattern for CommitCosmos to ensure separation of concerns, improve code maintainability, and guarantee idempotency for critical events like GitHub webhook commit deliveries and milestone unlocks. This architectural decision keeps application code clean and explainable for hackathon evaluation, while allowing database query optimizations, indexing strategies, and schema migrations to evolve without breaking consumers.
