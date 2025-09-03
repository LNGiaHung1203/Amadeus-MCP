// Standard MCP server - primarily uses STDIO transport
// Only enable HTTP transport if explicitly requested
const enableHttp = process.argv.includes('--http') || process.env.ENABLE_HTTP === 'true';

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AmadeusService } from './services/amadeusService.js';
import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables BEFORE creating any services
// Use absolute path to ensure .env is found regardless of working directory
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Debug: Check if credentials are loaded
if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
  console.error('✅ Amadeus credentials loaded successfully');
} else {
  console.error('❌ Amadeus credentials NOT loaded');
  console.error('AMADEUS_CLIENT_ID:', process.env.AMADEUS_CLIENT_ID ? 'Set' : 'Not set');
  console.error('AMADEUS_CLIENT_SECRET:', process.env.AMADEUS_CLIENT_SECRET ? 'Set' : 'Not set');
}

// Create MCP server
const server = new McpServer({
  name: "amadeus-mcp-server",
  version: "1.0.0"
});

// Initialize Amadeus service AFTER environment variables are loaded
const amadeusService = new AmadeusService();

// Set up server resources, tools, and prompts
setupServer();

// Standard MCP server - primarily uses STDIO transport
const transport = new StdioServerTransport();

// Connect to the transport
server.connect(transport).catch((error) => {
  // In STDIO mode, write to stderr to avoid interfering with MCP protocol
  process.stderr.write(`Failed to connect to STDIO transport: ${error}\n`);
  process.exit(1);
});

// In STDIO mode, write to stderr to avoid interfering with MCP protocol
process.stderr.write('Amadeus MCP Server running in STDIO mode\n');

// Optional: Enable HTTP transport if explicitly requested
if (enableHttp) {
  const app = express();
  app.use(express.json());

  // Simple HTTP endpoint for MCP
  app.all('/mcp', async (req, res) => {
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `http-${Date.now()}`
    });
    await server.connect(httpTransport);
    await httpTransport.handleRequest(req, res, req.body);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    process.stderr.write(`HTTP MCP endpoint available at: http://localhost:${PORT}/mcp\n`);
  });
}

function setupServer() {
  // ===== AMADEUS API TOOLS =====

  // ===== NEW FLIGHT APIs =====

  // Flight Offers V2 (POST) - Advanced flight search with simplified parameters
  server.tool("flight_offers_v2", "Search for flight offers using Amadeus Flight Offers V2 API with advanced parameters", {
    originLocationCode: z.string().describe("Origin airport code (e.g., 'JFK', 'LAX')"),
    destinationLocationCode: z.string().describe("Destination airport code (e.g., 'LAX', 'JFK')"),
    departureDate: z.string().describe("Departure date (YYYY-MM-DD)"),
    departureTime: z.string().optional().describe("Departure time (HH:MM:SS), defaults to '10:00:00'"),
    returnDate: z.string().optional().describe("Return date (YYYY-MM-DD) for round trip"),
    returnTime: z.string().optional().describe("Return time (HH:MM:SS), defaults to '18:00:00'"),
    adults: z.number().default(1).describe("Number of adult passengers"),
    children: z.number().default(0).describe("Number of child passengers"),
    infants: z.number().default(0).describe("Number of infant passengers"),
    currencyCode: z.string().default("USD").describe("Currency code (e.g., 'USD', 'EUR')"),
    maxFlightOffers: z.number().default(10).describe("Maximum number of flight offers to return"),
    cabinClass: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).optional().describe("Preferred cabin class")
  }, async (params) => {
    try {
      // Auto-generate IDs and build the complex structure
      const originDestinations = [{
        id: "1",
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDateTimeRange: {
          date: params.departureDate,
          time: params.departureTime || "10:00:00"
        }
      }];

      // Add return flight if specified
      if (params.returnDate) {
        originDestinations.push({
          id: "2",
          originLocationCode: params.destinationLocationCode,
          destinationLocationCode: params.originLocationCode,
          departureDateTimeRange: {
            date: params.returnDate,
            time: params.returnTime || "18:00:00"
          }
        });
      }

      // Auto-generate travelers
      const travelers = [];
      let travelerId = 1;
      
      for (let i = 0; i < params.adults; i++) {
        travelers.push({
          id: travelerId.toString(),
          travelerType: "ADULT"
        });
        travelerId++;
      }
      
      for (let i = 0; i < params.children; i++) {
        travelers.push({
          id: travelerId.toString(),
          travelerType: "CHILD"
        });
        travelerId++;
      }
      
      for (let i = 0; i < params.infants; i++) {
        travelers.push({
          id: travelerId.toString(),
          travelerType: "INFANT"
        });
        travelerId++;
      }

      // Build search criteria
      const searchCriteria: any = {
        maxFlightOffers: params.maxFlightOffers
      };

      // Add cabin restrictions if specified
      if (params.cabinClass) {
        searchCriteria.flightFilters = {
          cabinRestrictions: [{
            cabin: params.cabinClass,
            coverage: "ALL_SEGMENTS",
            originDestinationIds: originDestinations.map(od => od.id)
          }]
        };
      }

      const optimizedParams = {
        currencyCode: params.currencyCode,
        originDestinations,
        travelers,
        sources: ["GDS"],
        searchCriteria
      };

      const result = await amadeusService.searchFlightOffersV2(optimizedParams);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching flight offers V2: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  // Flight Offers (GET) - Simple flight search with query parameters
  server.tool("flight_offers_get", "Search for flight offers using Amadeus Flight Offers GET API with simple parameters", {
    originLocationCode: z.string().describe("Origin airport code (e.g., 'JFK')"),
    destinationLocationCode: z.string().describe("Destination airport code (e.g., 'LAX')"),
    departureDate: z.string().describe("Departure date (YYYY-MM-DD)"),
    returnDate: z.string().optional().describe("Return date (YYYY-MM-DD), optional for one-way flights"),
    adults: z.number().default(1).describe("Number of adult passengers"),
    nonStop: z.boolean().optional().describe("Search for non-stop flights only"),
    max: z.number().default(250).describe("Maximum number of results to return"),
    currencyCode: z.string().optional().describe("Currency code (e.g., 'USD', 'EUR')"),
    travelClass: z.string().optional().describe("Travel class (e.g., 'ECONOMY', 'BUSINESS', 'FIRST')"),
    includedAirlineCodes: z.string().optional().describe("Comma-separated list of airline codes to include"),
    excludedAirlineCodes: z.string().optional().describe("Comma-separated list of airline codes to exclude"),
    maxPrice: z.number().optional().describe("Maximum price filter")
  }, async (params) => {
    try {
      const result = await amadeusService.searchFlightOffersGet(params);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching flight offers GET: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });



  // Analytics Itinerary Price Metrics (GET) - Get price analytics and quartile rankings
  server.tool("analytics_price_metrics", "Get price analytics and quartile rankings using Amadeus Analytics Price Metrics API", {
    originIataCode: z.string().describe("Origin airport IATA code (e.g., 'JFK')"),
    destinationIataCode: z.string().describe("Destination airport IATA code (e.g., 'LAX')"),
    departureDate: z.string().describe("Departure date (YYYY-MM-DD)"),
    currencyCode: z.string().optional().describe("Currency code (e.g., 'USD', 'EUR')"),
    oneWay: z.boolean().optional().describe("One-way flight indicator")
  }, async (params) => {
    try {
      const result = await amadeusService.getAnalyticsPriceMetrics(params);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting analytics price metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  // Location Search (GET) - Search for airports, cities, and other locations
  server.tool("location_search", "Search for airports, cities, and other locations using Amadeus Location Search API", {
    keyword: z.string().describe("Search keyword (city name, airport code, etc.)"),
    subType: z.enum(['AIRPORT', 'CITY', 'AIRPORT,CITY']).optional().describe("Subtype filter"),
    countryCode: z.string().optional().describe("Country code (e.g., 'US', 'FR')"),
    pageLimit: z.number().default(10).describe("Maximum number of results to return"),
    pageOffset: z.number().default(0).describe("Number of results to skip"),
    sort: z.string().optional().describe("Sort order (e.g., 'analytics.travelers.score')"),
    view: z.enum(['LIGHT', 'FULL']).optional().describe("View type"),
    radius: z.number().optional().describe("Search radius"),
    latitude: z.number().optional().describe("Latitude coordinate"),
    longitude: z.number().optional().describe("Longitude coordinate")
  }, async (params) => {
    try {
      const searchParams = {
        keyword: params.keyword,
        subType: params.subType,
        countryCode: params.countryCode,
        page: {
          limit: params.pageLimit,
          offset: params.pageOffset
        },
        sort: params.sort,
        view: params.view,
        radius: params.radius,
        latitude: params.latitude,
        longitude: params.longitude
      };
      const result = await amadeusService.searchLocations(searchParams);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching locations: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  // Location Search by ID (GET) - Get detailed information about a specific location
  server.tool("location_by_id", "Get detailed information about a specific location using Amadeus Location by ID API", {
    locationId: z.string().describe("Location ID (e.g., 'CMUC', 'CJFK')")
  }, async (params) => {
    try {
      const result = await amadeusService.getLocationById(params.locationId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting location by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  // Transfer Offers (POST) - Search for ground transportation options
  server.tool("transfer_offers", "Search for ground transportation options using Amadeus Transfer Offers API", {
    startLocationCode: z.string().describe("Start location code (e.g., 'CDG', 'JFK')"),
    endAddress: z.string().describe("End address (e.g., 'Champs-Élysées, 1')"),
    endCity: z.string().describe("End city name (e.g., 'Paris')"),
    endCountryCode: z.string().describe("End country code (e.g., 'FR', 'US')"),
    endLocationName: z.string().describe("End location name (e.g., 'Arc de Triomphe')"),
    transferType: z.enum(['PRIVATE', 'SHARED', 'BUS', 'TRAIN', 'TAXI']).default('PRIVATE').describe("Transfer type"),
    departureDate: z.string().describe("Departure date (YYYY-MM-DD)"),
    departureTime: z.string().default("10:00").describe("Departure time (HH:MM)"),
    passengers: z.number().default(1).describe("Number of passengers"),
    adults: z.number().default(1).describe("Number of adult passengers"),
    children: z.number().default(0).describe("Number of child passengers"),
    infants: z.number().default(0).describe("Number of infant passengers")
  }, async (params) => {
    try {
      // Auto-generate coordinates for common locations
      const commonLocations: { [key: string]: string } = {
        'Paris': '48.8566,2.3522',
        'London': '51.5074,-0.1278',
        'New York': '40.7128,-74.0060',
        'Los Angeles': '34.0522,-118.2437',
        'Tokyo': '35.6762,139.6503',
        'Sydney': '-33.8688,151.2093'
      };

      const endGeoCode = commonLocations[params.endCity] || '48.8566,2.3522'; // Default to Paris
      const startDateTime = `${params.departureDate}T${params.departureTime}:00`;

      // Auto-generate passenger characteristics
      const passengerCharacteristics = [];
      for (let i = 0; i < params.adults; i++) {
        passengerCharacteristics.push({
          passengerTypeCode: 'ADT' as const,
          age: 30
        });
      }
      for (let i = 0; i < params.children; i++) {
        passengerCharacteristics.push({
          passengerTypeCode: 'CHD' as const,
          age: 10
        });
      }
      for (let i = 0; i < params.infants; i++) {
        passengerCharacteristics.push({
          passengerTypeCode: 'INF' as const,
          age: 1
        });
      }

      const optimizedParams = {
        startLocationCode: params.startLocationCode,
        endAddressLine: params.endAddress,
        endCityName: params.endCity,
        endZipCode: "75000", // Default ZIP code
        endCountryCode: params.endCountryCode,
        endName: params.endLocationName,
        endGeoCode: endGeoCode,
        transferType: params.transferType,
        startDateTime: startDateTime,
        passengers: params.passengers,
        passengerCharacteristics: passengerCharacteristics
      };

      const result = await amadeusService.searchTransferOffers(optimizedParams);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching transfer offers: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });



  // Add resources
  server.resource("amadeus_documentation", "https://developers.amadeus.com/", {
    description: "Amadeus API documentation and usage examples",
    mimeType: "text/markdown"
  }, async () => {
    return {
      contents: [{
        uri: "https://developers.amadeus.com/",
        mimeType: "text/markdown",
        text: `# Amadeus API Documentation

## Available Tools

### Flight APIs
- **flight_offers_v2**: Advanced flight search with detailed parameters (POST)
- **flight_offers_get**: Simple flight search with query parameters (GET)
- **analytics_price_metrics**: Get price analytics and quartile rankings (GET)

### Transfer APIs
- **transfer_offers**: Search for ground transportation options (POST)

### Location & Reference APIs
- **location_search**: Search for airports, cities, and other locations (GET)
- **location_by_id**: Get detailed information about a specific location (GET)
- **airport_search**: Search for airports by keyword
- **airport_nearest**: Find nearest airports to coordinates
- **airline_code_lookup**: Look up airline information by code
- **city_search**: Search for cities by keyword

### Hotel APIs
- **hotel_list_by_city**: Search hotels by city
- **hotel_list_by_ids**: Search hotels by IDs
- **hotel_list_by_geocode**: Search hotels by coordinates
- **hotel_search**: Get hotel offers from specific hotels
- **hotel_ratings**: Get hotel ratings and sentiments
- **hotel_name_autocomplete**: Get hotel name suggestions
- **hotel_offers_for_booking**: Get hotel offers for booking
- **hotel_inspiration**: Get hotel inspiration and city information

### Hotel Booking APIs
- **get_hotel_offers_alternative**: Get hotel offers using alternative method
- **get_hotel_booking_details**: Get details of a hotel booking
- **cancel_hotel_booking**: Cancel a hotel booking

## Usage Examples

### Flight Search
- Search for flights from JFK to LAX on a specific date
- Get advanced flight offers with cabin restrictions
- Analyze price metrics for routes

### Transfer Services
- Find private transfers from CDG Airport to Paris city center
- Search for shared transportation options
- Get pricing for ground transportation

### Location Services
- Search for airports and cities by name
- Get detailed location information by ID
- Find nearest airports to coordinates

### Hotel Services
- Search hotels in Paris with availability
- Get hotel ratings and reviews
- Find hotel offers for specific dates
- Book and manage hotel reservations

For more detailed information, visit: https://developers.amadeus.com/`
      }]
    };
  });
}
