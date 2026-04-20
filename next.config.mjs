/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' removed — Supabase SSR auth requires a Node.js runtime
  // for cookie-based sessions (middleware + server components).
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
