require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  blockchain: {
    initialDifficulty: parseInt(process.env.INITIAL_DIFFICULTY) || 6,
    miningReward: parseInt(process.env.MINING_REWARD) || 50,
    maxDifficulty: parseInt(process.env.MAX_DIFFICULTY) || 10
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000']
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

