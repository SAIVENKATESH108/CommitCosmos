import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log('Applying migration: creating releases table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS releases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      tag_name TEXT NOT NULL,
      release_name TEXT,
      released_at TIMESTAMP WITH TIME ZONE NOT NULL,
      unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT releases_project_id_tag_name_unique UNIQUE (project_id, tag_name)
    );
  `;
  console.log('✓ releases table verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_releases_project_id ON releases(project_id);
  `;
  console.log('✓ idx_releases_project_id index verified/created.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
