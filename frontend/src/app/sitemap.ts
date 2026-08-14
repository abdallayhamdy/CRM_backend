import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://leadswift-crm.com";
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/sign-in`, lastModified: new Date() },
  ];
}
