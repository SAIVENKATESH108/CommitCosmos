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
  console.log('Applying migration: creating closed_issues table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS closed_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      issue_number INTEGER NOT NULL,
      issue_title TEXT,
      closing_commit_sha TEXT,
      closing_pr_number INTEGER,
      closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT closed_issues_project_id_issue_number_unique UNIQUE (project_id, issue_number)
    );
  `;
  console.log('✓ closed_issues table verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_closed_issues_project_id ON closed_issues(project_id);
  `;
  console.log('✓ idx_closed_issues_project_id index verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_closed_issues_closed_at ON closed_issues(closed_at DESC);
  `;
  console.log('✓ idx_closed_issues_closed_at index verified/created.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
