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
  // Add tools
  server.tool("flight_search", "Search for available flights", {
    origin: z.string().describe("Origin airport code (e.g., 'JFK')"),
    destination: z.string().describe("Destination airport code (e.g., 'LAX')"),
    departureDate: z.string().describe("Departure date (YYYY-MM-DD)"),
    returnDate: z.string().optional().describe("Return date (YYYY-MM-DD), optional for one-way flights"),
    adults: z.number().default(1).describe("Number of adult passengers"),
    currencyCode: z.string().default("USD").describe("Currency code for pricing")
  }, async (params) => {
    try {
      const result = await amadeusService.searchFlights(params);
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
          text: `Error searching flights: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("hotel_search", "Search for hotels in a city using Amadeus Hotel List API. Returns real hotel data including names, IDs, addresses, and locations.", {
    cityCode: z.string().describe("City code (e.g., 'NYC')"),
    checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
    checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
    adults: z.number().default(1).describe("Number of adult guests"),
    radius: z.number().default(5).describe("Search radius in kilometers"),
    radiusUnit: z.string().default("KM").describe("Radius unit (KM or MI)")
  }, async (params) => {
    try {
      const result = await amadeusService.searchHotels(params);
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
          text: `Error searching hotels: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("airport_search", "Search for airports by keyword", {
    keyword: z.string().describe("Search keyword (city name, airport code, etc.)"),
    countryCode: z.string().optional().describe("Country code (e.g., 'US')")
  }, async (params) => {
    try {
      const result = await amadeusService.searchAirports(params);
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
          text: `Error searching airports: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("city_search", "Search for cities by keyword", {
    keyword: z.string().describe("Search keyword (city name, country, etc.)")
  }, async (params) => {
    try {
      const result = await amadeusService.searchCities(params);
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
          text: `Error searching cities: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("flight_offers_pricing", "Get pricing for flight offers", {
    flightOffers: z.array(z.any()).describe("Array of flight offers to price")
  }, async (params) => {
    try {
      const result = await amadeusService.getFlightPricing(params.flightOffers);
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
          text: `Error getting flight pricing: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("flight_inspiration", "Get flight inspiration and popular destinations", {
    origin: z.string().describe("Origin airport code (e.g., 'JFK')")
  }, async (params) => {
    try {
      const result = await amadeusService.getFlightInspiration(params.origin);
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
          text: `Error getting flight inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("hotel_inspiration", "Get hotel inspiration and city information", {
    cityCode: z.string().describe("City code (e.g., 'NYC')")
  }, async (params) => {
    try {
      const result = await amadeusService.getHotelInspiration(params.cityCode);
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
          text: `Error getting hotel inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  });

  server.tool("hotel_pricing", "Get pricing for hotel offers", {
    hotelOffers: z.array(z.any()).describe("Array of hotel offers to price")
  }, async (params) => {
    try {
      const result = await amadeusService.getHotelPricing(params.hotelOffers);
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
          text: `Error getting hotel pricing: ${error instanceof Error ? error.message : 'Unknown error'}`
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

### Flight Search
Search for available flights between airports with flexible date options.

### Hotel Search
Find hotels in specific cities with availability and pricing information.

### Airport Search
Look up airports by city name, airport code, or other keywords.

### City Search
Search for cities and their codes for use in other API calls.

### Flight Pricing
Get detailed pricing information for specific flight offers.

## Usage Examples

- Search for flights from JFK to LAX on a specific date
- Find hotels in Paris for next weekend
- Look up airport codes for major cities
- Get travel recommendations for specific destinations

For more detailed information, visit: https://developers.amadeus.com/`
      }]
    };
  });
}
