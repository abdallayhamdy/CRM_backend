import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const backendApiUrl = process.env.BACKEND_API_URL;

const cspValue = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval'" : ""} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://logo.clearbit.com https://ui-images.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspValue },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  async rewrites() {
    if (!backendApiUrl) return [];
    return [
      {
        source: '/api/laravel/:path*',
        destination: `${backendApiUrl}/api/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${backendApiUrl}/storage/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
