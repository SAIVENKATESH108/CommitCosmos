import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const statements = [
  {
    name: 'idx_commits_project_time',
    sql: `
      -- Optimizes timeline queries for a project's commits in reverse-chronological order
      CREATE INDEX IF NOT EXISTS idx_commits_project_time 
      ON commits (project_id, committed_at DESC);
    `,
  },
  {
    name: 'idx_commits_sha',
    sql: `
      -- Prevents duplicate stars if a webhook event is redelivered by GitHub
      CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_sha 
      ON commits (project_id, sha);
    `,
  },
  {
    name: 'idx_users_github_username',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_users_github_username 
      ON users (github_username);
    `,
  },
  {
    name: 'user_stats_view',
    sql: `
      CREATE OR REPLACE VIEW user_stats_view AS
      SELECT 
        u.id AS user_id,
        u.github_username,
        COALESCE(COUNT(DISTINCT c.id), 0)::integer AS total_commits,
        COALESCE(COUNT(DISTINCT p.id), 0)::integer AS total_projects,
        COALESCE(s.current_streak, 0)::integer AS current_streak,
        COALESCE(s.longest_streak, 0)::integer AS longest_streak
      FROM users u
      LEFT JOIN projects p ON p.user_id = u.id
      LEFT JOIN commits c ON c.project_id = p.id
      LEFT JOIN streaks s ON s.user_id = u.id
      GROUP BY u.id, u.github_username, s.current_streak, s.longest_streak;
    `,
  },
  {
    name: 'update_streak function',
    sql: `
      CREATE OR REPLACE FUNCTION update_streak()
      RETURNS TRIGGER AS $$
      DECLARE
        v_user_id UUID;
        v_last_active DATE;
        v_current_streak INT;
        v_longest_streak INT;
        v_commit_date DATE;
      BEGIN
        -- Look up user_id from the parent project
        SELECT user_id INTO v_user_id 
        FROM projects 
        WHERE id = NEW.project_id;

        IF v_user_id IS NULL THEN
          RETURN NEW;
        END IF;

        -- Extract commit date in UTC
        v_commit_date := (NEW.committed_at AT TIME ZONE 'UTC')::DATE;

        -- Lock and fetch streak record for this user
        SELECT last_active_date, current_streak, longest_streak
        INTO v_last_active, v_current_streak, v_longest_streak
        FROM streaks
        WHERE user_id = v_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
          -- Initialize first streak record
          INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
          VALUES (v_user_id, 1, 1, v_commit_date);
          RETURN NEW;
        END IF;

        -- Apply streak transition logic
        IF v_last_active IS NOT NULL AND v_commit_date = v_last_active THEN
          -- Same calendar day: leave unchanged
          NULL;
        ELSIF v_last_active IS NOT NULL AND v_commit_date = (v_last_active + INTERVAL '1 day')::DATE THEN
          -- Consecutive day: increment streak
          v_current_streak := v_current_streak + 1;
        ELSE
          -- Gap day or out of order: reset to 1
          v_current_streak := 1;
        END IF;

        -- Maintain longest streak record
        IF v_current_streak > v_longest_streak THEN
          v_longest_streak := v_current_streak;
        END IF;

        -- Update streak state
        UPDATE streaks
        SET current_streak = v_current_streak,
            longest_streak = v_longest_streak,
            last_active_date = v_commit_date
        WHERE user_id = v_user_id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    name: 'drop trg_update_streak trigger if exists',
    sql: `
      DROP TRIGGER IF EXISTS trg_update_streak ON commits;
    `,
  },
  {
    name: 'create trg_update_streak trigger',
    sql: `
      CREATE TRIGGER trg_update_streak
      AFTER INSERT ON commits
      FOR EACH ROW
      EXECUTE FUNCTION update_streak();
    `,
  },
];

async function run() {
  const sql = neon(databaseUrl!);

  console.log('Applying custom SQL database objects to Neon Postgres...');

  for (const item of statements) {
    process.stdout.write(`- Applying ${item.name}... `);
    await sql.query(item.sql.trim());
    console.log('Done.');
  }

  console.log('\n✓ All custom database objects (indexes, view, trigger) successfully applied!');
}

run().catch((err) => {
  console.error('\nFailed to apply statement:', err);
  process.exit(1);
});
