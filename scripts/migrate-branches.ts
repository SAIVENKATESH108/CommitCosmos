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
  console.log('Applying migration: creating branches table and adding branch_id to commits...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      branch_name TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      merged_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT branches_project_id_branch_name_unique UNIQUE (project_id, branch_name)
    );
  `;
  console.log('✓ branches table verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_branches_project_id ON branches(project_id);
  `;
  console.log('✓ idx_branches_project_id index verified/created.');

  await sql`
    ALTER TABLE commits ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
  `;
  console.log('✓ branch_id column on commits table verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_commits_branch_id ON commits(branch_id);
  `;
  console.log('✓ idx_commits_branch_id index verified/created.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
