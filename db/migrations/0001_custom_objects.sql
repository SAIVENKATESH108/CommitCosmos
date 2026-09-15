-- ==============================================================================
-- 1. Composite Timeline Index on Commits
-- ==============================================================================
-- This composite index on (project_id, committed_at DESC) enables index-only or 
-- fast index range scans when retrieving a project's commit history in reverse
-- chronological order. As commit history scales into thousands of stars per galaxy,
-- this avoids full-table sequential scans and expensive in-memory sort operations,
-- guaranteeing sub-millisecond timeline queries.
CREATE INDEX IF NOT EXISTS idx_commits_project_time 
ON commits (project_id, committed_at DESC);

-- ==============================================================================
-- 2. Unique Deduplication Index on Commits
-- ==============================================================================
-- Guarantees idempotency and prevents duplicate star entries if GitHub webhook 
-- events are redelivered or replayed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_sha 
ON commits (project_id, sha);

-- ==============================================================================
-- 3. Username Lookup Index on Users
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_github_username 
ON users (github_username);

-- ==============================================================================
-- 4. User Stats Aggregated Database View
-- ==============================================================================
-- Joins users, projects, commits, and streaks to provide pre-aggregated metrics
-- for user profiles and dashboards without recomputing heavy aggregations in app code.
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

-- ==============================================================================
-- 5. Automated Streak Engine: PL/pgSQL Function & Trigger
-- ==============================================================================
-- Calculates daily commit streaks automatically upon every commit insertion.
-- Resolves user_id via project_id -> projects.user_id.
-- - Same calendar day: leaves current_streak unchanged
-- - Exactly 1 day after last_active_date: increments current_streak
-- - Gap > 1 day (or backwards): resets current_streak to 1
-- Always updates longest_streak to GREATEST(longest_streak, current_streak)
-- Always updates last_active_date to the new commit's date.
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
    -- Same calendar day: no increment
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

-- Attach trigger to commits table
DROP TRIGGER IF EXISTS trg_update_streak ON commits;
CREATE TRIGGER trg_update_streak
AFTER INSERT ON commits
FOR EACH ROW
EXECUTE FUNCTION update_streak();
