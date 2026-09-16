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
  console.log('Applying migration: extending teams, projects, and commits tables...');

  // 1. Extend teams table
  await sql`
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  `;
  await sql`
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
  `;
  await sql`
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON teams(invite_code);
  `;
  console.log('✓ teams table extended.');

  // 2. Extend team_members table
  await sql`
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
  `;
  await sql`
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
  `;
  console.log('✓ team_members table extended.');

  // 3. Extend projects table
  await sql`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
  `;
  console.log('✓ projects table extended with team_id.');

  // 4. Extend commits table
  await sql`
    ALTER TABLE commits ADD COLUMN IF NOT EXISTS author_username TEXT;
  `;
  await sql`
    ALTER TABLE commits ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_commits_author_username ON commits(author_username);
  `;
  console.log('✓ commits table extended with author_username and author_avatar_url.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
