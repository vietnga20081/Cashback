require('dotenv').config({ path: './apps/backend/.env' });

module.exports = {
  apps: [{
    name: 'greencash-api',
    script: './apps/backend/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    error_file: './logs/pm2/api-error.log',
    out_file: './logs/pm2/api-out.log',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      ...require('dotenv').config({ path: './apps/backend/.env' }).parsed
    }
  }]
};
