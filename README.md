# Amadeus MCP Server

A Model Context Protocol (MCP) server that provides access to the Amadeus Travel API, allowing AI assistants and other MCP clients to search for flights, hotels, airports, and cities.

## Features

- **Flight Search**: Search for available flights between airports with flexible date options
- **Hotel Search**: Find hotels in specific cities with availability and pricing information
- **Airport Search**: Look up airports by city name, airport code, or other keywords
- **City Search**: Search for cities and their codes for use in other API calls
- **Flight Pricing**: Get detailed pricing information for specific flight offers
- **Travel Planning**: Interactive prompts for travel assistance
- **Documentation**: Access to Amadeus API documentation and usage examples

## Prerequisites

- Node.js 18+ 
- Amadeus API credentials (Client ID and Client Secret)
- TypeScript knowledge (for development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd amadeus-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your Amadeus API credentials:
```env
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
PORT=3000
NODE_ENV=development
```

## Getting Amadeus API Credentials

1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Create an account and log in
3. Create a new application to get your Client ID and Client Secret
4. Choose between test and production environments

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on the configured port (default: 3000).

## MCP Endpoints

- **MCP Endpoint**: `http://localhost:3000/mcp`
- **Messages Endpoint**: `http://localhost:3000/messages`

## Available Tools

### flight_search
Search for available flights between airports.

**Parameters:**
- `origin` (required): Origin airport code (e.g., 'JFK')
- `destination` (required): Destination airport code (e.g., 'LAX')
- `departureDate` (required): Departure date (YYYY-MM-DD)
- `returnDate` (optional): Return date for round-trip flights
- `adults` (optional): Number of adult passengers (default: 1)
- `currencyCode` (optional): Currency for pricing (default: 'USD')

**Example:**
```typescript
const result = await client.callTool({
  name: "flight_search",
  arguments: {
    origin: "JFK",
    destination: "LAX",
    departureDate: "2024-12-25",
    adults: 2,
    currencyCode: "USD"
  }
});
```

### hotel_search
Search for available hotels in a specific city.

**Parameters:**
- `cityCode` (required): City code (e.g., 'NYC')
- `checkInDate` (required): Check-in date (YYYY-MM-DD)
- `checkOutDate` (required): Check-out date (YYYY-MM-DD)
- `adults` (optional): Number of adult guests (default: 1)
- `radius` (optional): Search radius in kilometers (default: 5)
- `radiusUnit` (optional): Radius unit (KM or MI, default: 'KM')

**Example:**
```typescript
const result = await client.callTool({
  name: "hotel_search",
  arguments: {
    cityCode: "NYC",
    checkInDate: "2024-12-24",
    checkOutDate: "2024-12-26",
    adults: 2,
    radius: 10
  }
});
```

### airport_search
Search for airports by keyword.

**Parameters:**
- `keyword` (required): Search keyword (city name, airport code, etc.)
- `countryCode` (optional): Country code (e.g., 'US')

**Example:**
```typescript
const result = await client.callTool({
  name: "airport_search",
  arguments: {
    keyword: "New York",
    countryCode: "US"
  }
});
```

### city_search
Search for cities by keyword.

**Parameters:**
- `keyword` (required): Search keyword (city name, country, etc.)

**Example:**
```typescript
const result = await client.callTool({
  name: "city_search",
  arguments: {
    keyword: "Paris"
  }
});
```

### flight_offers_pricing
Get detailed pricing for flight offers.

**Parameters:**
- `flightOffers` (required): Array of flight offers to price

**Example:**
```typescript
const result = await client.callTool({
  name: "flight_offers_pricing",
  arguments: {
    flightOffers: [/* flight offer objects */]
  }
});
```

## Available Prompts

### travel_planner
Get travel planning assistance with interactive responses.

**Parameters:**
- `destination` (required): Destination city or country
- `travelDates` (optional): Travel dates (e.g., 'Next week', 'Summer 2024')
- `budget` (optional): Budget range (e.g., 'Under $1000', 'Luxury')
- `preferences` (optional): Travel preferences (e.g., 'Direct flights only', 'Hotel with pool')

**Example:**
```typescript
const result = await client.getPrompt({
  name: "travel_planner",
  arguments: {
    destination: "Tokyo",
    travelDates: "Next month",
    budget: "Under $2000",
    preferences: "Direct flights and hotels near public transport"
  }
});
```

## Available Resources

### amadeus_documentation
Access to Amadeus API documentation and usage examples.

**Example:**
```typescript
const result = await client.readResource({
  uri: "https://developers.amadeus.com/"
});
```

## Example Client

The repository includes an example client that demonstrates how to connect to and use the MCP server:

```bash
npm run build
node dist/client/exampleClient.js
```

## Error Handling

The server includes comprehensive error handling for:
- Missing or invalid API credentials
- API rate limiting
- Network errors
- Invalid input parameters
- Amadeus API errors

All errors are properly formatted and returned to the client with meaningful error messages.

## Development

### Project Structure

```
src/
├── server.ts              # Main MCP server with Express integration
├── services/
│   └── amadeusService.ts  # Amadeus API service layer
└── client/
    └── exampleClient.ts   # Example MCP client
```

### Adding New Tools

To add new tools, follow this pattern in `server.ts`:

```typescript
server.setRequestHandler("tool_name", {
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: {
      // Define your parameters here
    },
    required: ["required_param"]
  }
}, async (request) => {
  try {
    const result = await amadeusService.yourMethod(request.params);
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
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
});
```

### Adding New Prompts

To add new prompts:

```typescript
server.setPromptHandler("prompt_name", {
  description: "Prompt description",
  inputSchema: {
    type: "object",
    properties: {
      // Define your parameters here
    },
    required: ["required_param"]
  }
}, async (request) => {
  // Your prompt logic here
  return {
    content: [{
      type: "text",
      text: "Your response here"
    }]
  };
});
```

## Testing

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Amadeus API documentation](https://developers.amadeus.com/)
- Review the MCP specification
- Open an issue in this repository

## Related Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Amadeus for Developers](https://developers.amadeus.com/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
