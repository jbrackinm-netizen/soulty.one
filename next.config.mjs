/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client"],
  },
  allowedDevOrigins: ["*.replit.dev", "*.replit.app"],
};

export default nextConfig;
