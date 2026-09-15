import { MetadataRoute } from 'next';
import { db } from '@/db';
import { users } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://commitcosmos.vercel.app';

  // Base routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    // Query all registered users to dynamically build profile sitemap entries
    const allUsers = await db.select({ username: users.githubUsername }).from(users);

    const userProfileRoutes: MetadataRoute.Sitemap = allUsers.map((u) => ({
      url: `${baseUrl}/u/${encodeURIComponent(u.username)}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...userProfileRoutes];
  } catch (err) {
    console.error('[Sitemap] Failed to fetch dynamic users, returning static routes:', err);
    return staticRoutes;
  }
}
