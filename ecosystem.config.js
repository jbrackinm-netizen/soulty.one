module.exports = {
  apps: [
    // Next.js dashboard — cluster mode for production resilience
    {
      name: 'soulty-council',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/nexus-brain',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
      error_file: '/home/nexus-brain/logs/error.log',
      out_file: '/home/nexus-brain/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    // Nexus Brain Express API
    {
      name: 'nexus-brain',
      script: 'server.js',
      cwd: '/home/nexus-brain',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
      },
      error_file: '/home/nexus-brain/logs/nexus-error.log',
      out_file: '/home/nexus-brain/logs/nexus-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
  deploy: {
    production: {
      user: 'nexus-brain',
      host: 'your-vm-ip',
      ref: 'origin/main',
      repo: 'https://github.com/jbrackinm-netizen/soulty.one.git',
      path: '/home/nexus-brain',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
