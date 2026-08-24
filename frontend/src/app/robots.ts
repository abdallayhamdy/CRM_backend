import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/pricing", "/login"],
        disallow: [
          "/dashboard",
          "/contacts",
          "/companies",
          "/deals",
          "/tasks",
          "/tickets",
          "/notes",
          "/calls",
          "/orders",
          "/products",
          "/documents",
          "/pipelines",
          "/activity-feed",
          "/reports",
          "/settings",
          "/super-admin",
          "/search",
          "/reset-password",
          "/accept-invite",
          "/bootstrap",
          "/api/",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://leadswift-crm.com"}/sitemap.xml`,
  };
}
