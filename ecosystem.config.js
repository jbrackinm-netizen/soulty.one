module.exports = {
  apps: [
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
        PORT: 3000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
    },
  ],
};
