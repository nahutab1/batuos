import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack causes "Ready" hang on Windows — use default webpack for dev
  // For dev: use `npx next dev --no-turbopack`
  // For prod: `npx next build && npx next start`
};

export default nextConfig;
