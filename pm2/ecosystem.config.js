module.exports = {
  apps: [
    {
      name: 'greencash-api',
      cwd: './apps/backend',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '../../logs/pm2/api-error.log',
      out_file: '../../logs/pm2/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'greencash-frontend',
      cwd: './apps/frontend',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '../../logs/pm2/frontend-error.log',
      out_file: '../../logs/pm2/frontend-out.log',
    },
  ],
};
