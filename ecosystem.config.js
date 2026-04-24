module.exports = {
  apps: [
    // Next.js dashboard — port 5000 (proxied by Nginx on 80)
    {
      name: 'soulty-council',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/nexus-brain',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
    },
    // Nexus Brain Express API — port 3000 (proxied by Nginx on /api or separate subdomain)
    {
      name: 'nexus-brain',
      script: 'server.js',
      cwd: '/home/nexus-brain',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
    },
  ],
};
