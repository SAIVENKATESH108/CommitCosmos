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
  console.log('Applying migration: adding is_pr_merge and pr_number columns to commits...');
  
  await sql`
    ALTER TABLE commits ADD COLUMN IF NOT EXISTS is_pr_merge BOOLEAN NOT NULL DEFAULT FALSE;
  `;
  console.log('✓ is_pr_merge column verified/created.');

  await sql`
    ALTER TABLE commits ADD COLUMN IF NOT EXISTS pr_number INTEGER;
  `;
  console.log('✓ pr_number column verified/created.');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_commits_is_pr_merge ON commits(is_pr_merge);
  `;
  console.log('✓ idx_commits_is_pr_merge index verified/created.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
