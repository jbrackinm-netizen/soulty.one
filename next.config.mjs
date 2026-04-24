/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@google-cloud/secret-manager",
    ],
    instrumentationHook: true,
  },
  allowedDevOrigins: ["*.replit.dev", "*.replit.app"],
};

export default nextConfig;
