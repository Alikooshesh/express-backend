module.exports = {
  apps: [{
    name: 'express-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    }
  }]
}; 