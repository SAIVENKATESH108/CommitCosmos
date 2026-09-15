import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Automatically load .env.local if running in standalone scripts / CLI
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Neon HTTP serverless client singleton
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export * from './schema';
