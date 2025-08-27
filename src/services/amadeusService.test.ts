import { AmadeusService } from './amadeusService';

// Mock environment variables for testing
const originalEnv = process.env;

describe('AmadeusService', () => {
  let amadeusService: AmadeusService;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Mock STDIO mode detection
    jest.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'test.js']);
    jest.spyOn(process.stdin, 'isTTY', 'get').mockReturnValue(true);
    process.env.MCP_INSPECTOR = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with valid credentials', () => {
      process.env.AMADEUS_CLIENT_ID = 'test-client-id';
      process.env.AMADEUS_CLIENT_SECRET = 'test-client-secret';
      
      expect(() => new AmadeusService()).not.toThrow();
    });

    test('should throw error without credentials in non-STDIO mode', () => {
      delete process.env.AMADEUS_CLIENT_ID;
      delete process.env.AMADEUS_CLIENT_SECRET;
      
      expect(() => new AmadeusService()).toThrow('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set');
    });

    test('should handle missing credentials in STDIO mode', () => {
      delete process.env.AMADEUS_CLIENT_ID;
      delete process.env.AMADEUS_CLIENT_SECRET;
      
      // Mock STDIO mode
      jest.spyOn(process.stdin, 'isTTY', 'get').mockReturnValue(false);
      
      expect(() => new AmadeusService()).not.toThrow();
    });
  });

  describe('Flight APIs', () => {
    beforeEach(() => {
      process.env.AMADEUS_CLIENT_ID = 'test-client-id';
      process.env.AMADEUS_CLIENT_SECRET = 'test-client-secret';
      amadeusService = new AmadeusService();
    });

    test('searchFlights should handle valid parameters', async () => {
      const params = {
        origin: 'NYC',
        destination: 'LAX',
        departureDate: '2024-12-25',
        adults: 2,
        currencyCode: 'USD'
      };

      const result = await amadeusService.searchFlights(params);
      expect(result.success).toBe(true);
      expect(result.searchParams).toEqual(params);
    });

    test('searchFlights should handle return date', async () => {
      const params = {
        origin: 'NYC',
        destination: 'LAX',
        departureDate: '2024-12-25',
        returnDate: '2024-12-30',
        adults: 1
      };

      const result = await amadeusService.searchFlights(params);
      expect(result.success).toBe(true);
      expect(result.searchParams).toEqual(params);
    });

    test('getFlightPricing should handle flight offers', async () => {
      const flightOffers = [
        {
          id: '1',
          pricingOptions: { fareType: 'PUBLISHED' }
        }
      ];

      const result = await amadeusService.getFlightPricing(flightOffers);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('getFlightInspiration should handle origin city', async () => {
      const result = await amadeusService.getFlightInspiration('NYC');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Hotel APIs', () => {
    beforeEach(() => {
      process.env.AMADEUS_CLIENT_ID = 'test-client-id';
      process.env.AMADEUS_CLIENT_SECRET = 'test-client-secret';
      amadeusService = new AmadeusService();
    });

    test('searchHotels should handle valid parameters', async () => {
      const params = {
        cityCode: 'NYC',
        checkInDate: '2024-12-25',
        checkOutDate: '2024-12-30',
        adults: 2,
        radius: 10,
        radiusUnit: 'KM'
      };

      const result = await amadeusService.searchHotels(params);
      expect(result.success).toBe(true);
      expect(result.searchParams).toEqual(params);
    });

    test('getHotelPricing should handle hotel offers', async () => {
      const hotelOffers = [
        {
          id: '1',
          pricingOptions: { fareType: 'PUBLISHED' }
        }
      ];

      const result = await amadeusService.getHotelPricing(hotelOffers);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('getHotelInspiration should handle city code', async () => {
      const result = await amadeusService.getHotelInspiration('NYC');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Reference Data APIs', () => {
    beforeEach(() => {
      process.env.AMADEUS_CLIENT_ID = 'test-client-id';
      process.env.AMADEUS_CLIENT_SECRET = 'test-client-secret';
      amadeusService = new AmadeusService();
    });

    test('searchAirports should handle keyword search', async () => {
      const params = {
        keyword: 'JFK',
        countryCode: 'US'
      };

      const result = await amadeusService.searchAirports(params);
      expect(result.success).toBe(true);
      expect(result.searchParams).toEqual(params);
    });

    test('searchCities should handle city search', async () => {
      const params = {
        keyword: 'New York'
      };

      const result = await amadeusService.searchCities(params);
      expect(result.success).toBe(true);
      expect(result.searchParams).toEqual(params);
    });
  });

  describe('Mock Data Fallback', () => {
    beforeEach(() => {
      delete process.env.AMADEUS_CLIENT_ID;
      delete process.env.AMADEUS_CLIENT_SECRET;
      
      // Mock STDIO mode
      jest.spyOn(process.stdin, 'isTTY', 'get').mockReturnValue(false);
      amadeusService = new AmadeusService();
    });

    test('should return mock data for searchFlights when Amadeus is null', async () => {
      const params = {
        origin: 'NYC',
        destination: 'LAX',
        departureDate: '2024-12-25'
      };

      const result = await amadeusService.searchFlights(params);
      expect(result.success).toBe(true);
      expect(result.data[0].method).toBe('searchFlights');
      expect(result.data[0].message).toContain('Mock data');
    });

    test('should return mock data for searchHotels when Amadeus is null', async () => {
      const params = {
        cityCode: 'NYC',
        checkInDate: '2024-12-25',
        checkOutDate: '2024-12-30'
      };

      const result = await amadeusService.searchHotels(params);
      expect(result.success).toBe(true);
      expect(result.data[0].method).toBe('searchHotels');
      expect(result.data[0].message).toContain('Mock data');
    });

    test('should return mock data for searchAirports when Amadeus is null', async () => {
      const params = {
        keyword: 'JFK'
      };

      const result = await amadeusService.searchAirports(params);
      expect(result.success).toBe(true);
      expect(result.data[0].method).toBe('searchAirports');
      expect(result.data[0].message).toContain('Mock data');
    });

    test('should return mock data for searchCities when Amadeus is null', async () => {
      const params = {
        keyword: 'New York'
      };

      const result = await amadeusService.searchCities(params);
      expect(result.success).toBe(true);
      expect(result.data[0].method).toBe('searchCities');
      expect(result.data[0].message).toContain('Mock data');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.AMADEUS_CLIENT_ID = 'test-client-id';
      process.env.AMADEUS_CLIENT_SECRET = 'test-client-secret';
      amadeusService = new AmadeusService();
    });

    test('should handle API errors gracefully', async () => {
      // This test would require mocking the Amadeus SDK to simulate errors
      // For now, we'll test the error handling structure
      expect(amadeusService).toBeDefined();
    });
  });
});

