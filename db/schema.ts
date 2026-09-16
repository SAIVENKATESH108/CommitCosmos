import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
  integer,
  date,
  boolean,
  unique,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    githubId: bigint('github_id', { mode: 'number' }).unique().notNull(),
    githubUsername: text('github_username').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idxUsersGithubUsername: index('idx_users_github_username').on(table.githubUsername),
  })
);

// 2. Projects Table
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    repoUrl: text('repo_url').notNull(),
    repoName: text('repo_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRepoUnique: unique('projects_user_id_repo_url_unique').on(table.userId, table.repoUrl),
    idxProjectsTeamId: index('idx_projects_team_id').on(table.teamId),
  })
);

// 2b. Branches Table (Git Primitive)
export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    branchName: text('branch_name').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    mergedAt: timestamp('merged_at', { withTimezone: true }),
  },
  (table) => ({
    projectBranchUnique: unique('branches_project_id_branch_name_unique').on(table.projectId, table.branchName),
    idxBranchesProject: index('idx_branches_project_id').on(table.projectId),
  })
);

// 3. Commits Table
export const commits = pgTable(
  'commits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    sha: text('sha').notNull(),
    message: text('message'),
    language: text('language'),
    committedAt: timestamp('committed_at', { withTimezone: true }).notNull(),
    magnitude: integer('magnitude'),
    isPrMerge: boolean('is_pr_merge').default(false).notNull(),
    prNumber: integer('pr_number'),
    authorUsername: text('author_username'),
    authorAvatarUrl: text('author_avatar_url'),
  },
  (table) => ({
    projectShaUnique: unique('commits_project_id_sha_unique').on(table.projectId, table.sha),
    idxCommitsProjectTime: index('idx_commits_project_time').on(table.projectId, table.committedAt.desc()),
    idxCommitsSha: uniqueIndex('idx_commits_sha').on(table.projectId, table.sha),
    idxCommitsBranchId: index('idx_commits_branch_id').on(table.branchId),
    idxCommitsIsPrMerge: index('idx_commits_is_pr_merge').on(table.isPrMerge),
    idxCommitsAuthor: index('idx_commits_author_username').on(table.authorUsername),
  })
);

// 4. Sky State Table
export const skyState = pgTable('sky_state', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalStars: integer('total_stars').default(0).notNull(),
  clusterCount: integer('cluster_count').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Streaks Table
export const streaks = pgTable('streaks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: date('last_active_date', { mode: 'string' }),
});

// 6. Constellations Table
export const constellations = pgTable('constellations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  streakLength: integer('streak_length').notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Releases Table (Milestone Unlock Pattern for Tagged Releases)
export const releases = pgTable(
  'releases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagName: text('tag_name').notNull(),
    releaseName: text('release_name'),
    releasedAt: timestamp('released_at', { withTimezone: true }).notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectTagUnique: unique('releases_project_id_tag_name_unique').on(table.projectId, table.tagName),
    idxReleasesProject: index('idx_releases_project_id').on(table.projectId),
  })
);

// 7b. Closed Issues Table (Transient Celebratory Shooting Star Events)
export const closedIssues = pgTable(
  'closed_issues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    issueNumber: integer('issue_number').notNull(),
    issueTitle: text('issue_title'),
    closingCommitSha: text('closing_commit_sha'),
    closingPrNumber: integer('closing_pr_number'),
    closedAt: timestamp('closed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIssueUnique: unique('closed_issues_project_id_issue_number_unique').on(table.projectId, table.issueNumber),
    idxClosedIssuesProject: index('idx_closed_issues_project_id').on(table.projectId),
    idxClosedIssuesTime: index('idx_closed_issues_closed_at').on(table.closedAt.desc()),
  })
);

// 8. Teams Table
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    inviteCode: text('invite_code').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idxTeamsInviteCode: index('idx_teams_invite_code').on(table.inviteCode),
  })
);

// 9. Team Members Table
export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
    idxTeamMembersUser: index('idx_team_members_user_id').on(table.userId),
  })
);

// Relations definitions
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  skyState: one(skyState, {
    fields: [users.id],
    references: [skyState.userId],
  }),
  streaks: one(streaks, {
    fields: [users.id],
    references: [streaks.userId],
  }),
  constellations: many(constellations),
  teamMemberships: many(teamMembers),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  branches: many(branches),
  commits: many(commits),
  releases: many(releases),
}));

export const releasesRelations = relations(releases, ({ one }) => ({
  project: one(projects, {
    fields: [releases.projectId],
    references: [projects.id],
  }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  project: one(projects, {
    fields: [branches.projectId],
    references: [projects.id],
  }),
  commits: many(commits),
}));

export const commitsRelations = relations(commits, ({ one }) => ({
  project: one(projects, {
    fields: [commits.projectId],
    references: [projects.id],
  }),
  branch: one(branches, {
    fields: [commits.branchId],
    references: [branches.id],
  }),
}));

export const constellationsRelations = relations(constellations, ({ one }) => ({
  user: one(users, {
    fields: [constellations.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  projects: many(projects),
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// Type exports for strong typing across repositories
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
export type SkyState = typeof skyState.$inferSelect;
export type NewSkyState = typeof skyState.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
export type Constellation = typeof constellations.$inferSelect;
export type NewConstellation = typeof constellations.$inferInsert;
export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;
export type ClosedIssue = typeof closedIssues.$inferSelect;
export type NewClosedIssue = typeof closedIssues.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export interface UserStats {
  userId: string;
  githubUsername: string;
  totalCommits: number;
  totalProjects: number;
  currentStreak: number;
  longestStreak: number;
}


