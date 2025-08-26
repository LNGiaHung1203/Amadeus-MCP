import Amadeus from 'amadeus';
import config from './config.js';

let amadeus;

// Initialize Amadeus client
try {
  console.log(`🔑 Initializing Amadeus client with ID: ${config.amadeus.clientId.substring(0, 8)}...`);
  console.log(`🌍 Environment: ${config.amadeus.environment}`);
  
  const amadeusConfig = {
    clientId: config.amadeus.clientId,
    clientSecret: config.amadeus.clientSecret
  };
  
  if (config.amadeus.environment === 'test') {
    amadeusConfig.hostname = 'test.api.amadeus.com';
    amadeusConfig.host = 'test.api.amadeus.com';
    amadeusConfig.baseURL = 'https://test.api.amadeus.com';
    console.log('🔧 Using test environment: test.api.amadeus.com');
  } else {
    amadeusConfig.hostname = 'api.amadeus.com';
    amadeusConfig.host = 'api.amadeus.com';
    amadeusConfig.baseURL = 'https://api.amadeus.com';
    console.log('🔧 Using production environment: api.amadeus.com');
  }
  
  console.log('🔧 Amadeus config:', JSON.stringify(amadeusConfig, null, 2));
  
  amadeus = new Amadeus(amadeusConfig);
  
  // Log successful connection
  console.log(`✅ Amadeus client initialized successfully`);
  console.log(`🌍 Environment: ${config.amadeus.environment}`);
} catch (error) {
  console.warn(`⚠️  Amadeus client initialization failed: ${error.message}`);
  console.log('🔑 Please set up your credentials using: npm run setup');
  
  // Create a mock client for testing without credentials
  amadeus = {
    shopping: {
      flightOffersSearch: {
        get: async () => { throw new Error('API credentials required. Run: npm run setup'); }
      },
      hotelOffersSearch: {
        get: async () => { throw new Error('API credentials required. Run: npm run setup'); }
      }
    },
    referenceData: {
      locations: {
        get: async () => { throw new Error('API credentials required. Run: npm run setup'); }
      }
    }
  };
}

export default amadeus;
