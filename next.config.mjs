/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.KITEA_E2E === "true" ? ".work/next-e2e" : ".next",
  output: process.env.VERCEL === "1" ? undefined : "standalone",
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: false },
  experimental: { serverActions: { bodySizeLimit: "40kb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
