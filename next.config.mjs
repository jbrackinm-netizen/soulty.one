/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      '@libsql/client',
      '@google-cloud/secret-manager',
    ],
    instrumentationHook: true,
  },
  allowedDevOrigins: ['*.replit.dev', '*.replit.app'],
};

export default nextConfig;
