# Galaxy 3D Scene Components

This directory is reserved for the 3D galaxy visualization components of CommitCosmos.

## Planned Responsibilities

- **Canvas & Scene Setup**: Three.js / React Three Fiber scene initialization, camera rigging, orbit controls, and post-processing bloom/nebula shaders.
- **Star Nodes**: Instanced mesh rendering of individual commit stars, categorized by commit recency, impact, and repository branch.
- **Constellation Connectors**: Line and curve geometries connecting consecutive daily streaks into glowing constellations.
- **Interactive Raycasting & Tooltips**: Click and hover interactions on stars to inspect commit metadata (hash, message, author, additions/deletions).
