import type { MetadataRoute } from "next";
import { client, POSTS_SLUGS_QUERY } from "@/lib/sanity";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mukoko.com";

  const slugs: string[] = await client.fetch(POSTS_SLUGS_QUERY);
  const blogEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/manifesto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...blogEntries,
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/acceptable-use`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];
}
