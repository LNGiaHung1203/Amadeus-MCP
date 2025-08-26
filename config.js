import dotenv from 'dotenv';
dotenv.config();

const config = {
  amadeus: {
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    environment: process.env.AMADEUS_ENVIRONMENT || 'test'
  },
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate required configuration
if (!config.amadeus.clientId || !config.amadeus.clientSecret) {
  console.warn('⚠️  Warning: AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET are not set');
  console.log('📝 Please copy env.example to .env and fill in your credentials');
  console.log('🔗 Get your credentials from: https://developers.amadeus.com/');
  console.log('🚀 You can run: npm run setup to configure your credentials\n');
  
  // Set dummy values for testing without credentials
  config.amadeus.clientId = 'dummy_id';
  config.amadeus.clientSecret = 'dummy_secret';
}

export default config;
