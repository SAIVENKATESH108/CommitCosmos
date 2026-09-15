import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
  integer,
  date,
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
    repoUrl: text('repo_url').notNull(),
    repoName: text('repo_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRepoUnique: unique('projects_user_id_repo_url_unique').on(table.userId, table.repoUrl),
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
    sha: text('sha').notNull(),
    message: text('message'),
    language: text('language'),
    committedAt: timestamp('committed_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    projectShaUnique: unique('commits_project_id_sha_unique').on(table.projectId, table.sha),
    idxCommitsProjectTime: index('idx_commits_project_time').on(table.projectId, table.committedAt.desc()),
    idxCommitsSha: uniqueIndex('idx_commits_sha').on(table.projectId, table.sha),
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

// 7. Teams Table
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});

// 8. Team Members Table
export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
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
  commits: many(commits),
}));

export const commitsRelations = relations(commits, ({ one }) => ({
  project: one(projects, {
    fields: [commits.projectId],
    references: [projects.id],
  }),
}));

export const constellationsRelations = relations(constellations, ({ one }) => ({
  user: one(users, {
    fields: [constellations.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
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
export type Commit = typeof commits.$inferSelect;
export type NewCommit = typeof commits.$inferInsert;
export type SkyState = typeof skyState.$inferSelect;
export type NewSkyState = typeof skyState.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
export type Constellation = typeof constellations.$inferSelect;
export type NewConstellation = typeof constellations.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;

export interface UserStats {
  userId: string;
  githubUsername: string;
  totalCommits: number;
  totalProjects: number;
  currentStreak: number;
  longestStreak: number;
}

