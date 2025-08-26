# Amadeus MCP Server

A Model Context Protocol (MCP) server that provides travel booking capabilities using the Amadeus API. This server allows AI assistants to search for flights, hotels, and get travel recommendations.

## Features

- ✈️ **Flight Search**: Search for available flights between airports
- 🏨 **Hotel Search**: Find hotels in specific cities
- 💡 **Travel Recommendations**: Get personalized travel tips and activity suggestions
- 🔐 **Secure API Integration**: Uses Amadeus API with proper authentication
- 🧪 **Testing Tools**: Built-in testing and validation

## Prerequisites

- Node.js 18.0.0 or higher
- Amadeus API credentials (get them from [Amadeus Developers](https://developers.amadeus.com/))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Amadeus API Credentials

Run the interactive setup script:

```bash
npm run setup
```

This will prompt you for:

- Amadeus Client ID
- Amadeus Client Secret
- Environment (test/live)

Alternatively, manually create a `.env` file based on `env.example`:

```bash
cp env.example .env
# Edit .env with your credentials
```

### 3. Test the Server

**Basic Server (3 tools):**

```bash
npm test
```

**Comprehensive Server (17 tools):**

```bash
npm run comprehensive
```

**Test All Tools:**

```bash
npm run test:comprehensive
```

### 4. Start the Server

**Basic Server:**

```bash
npm start
```

**Comprehensive Server:**

```bash
npm run comprehensive
```

### 5. Use as MCP Server

**Basic Server:**

```bash
npm run mcp
```

**Comprehensive Server:**

```bash
npm run comprehensive
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here
AMADEUS_ENVIRONMENT=test
LOG_LEVEL=info
```

### Amadeus API Setup

1. Go to [Amadeus Developers](https://developers.amadeus.com/)
2. Create an account and log in
3. Create a new application
4. Copy your Client ID and Client Secret
5. Choose between test (sandbox) or live environment

## Available Tools

### 1. Search Flights (`search_flights`)

Search for available flights between airports.

**Parameters:**

- `origin` (required): Origin airport code (e.g., "NYC", "LAX", "LHR")
- `destination` (required): Destination airport code
- `departureDate` (required): Departure date in YYYY-MM-DD format
- `returnDate` (optional): Return date for round-trip flights
- `adults` (optional): Number of adult passengers (default: "1")
- `max` (optional): Maximum results to return (default: "10")

**Example:**

```json
{
  "origin": "NYC",
  "destination": "LAX",
  "departureDate": "2024-06-01",
  "adults": "2",
  "max": "5"
}
```

### 2. Search Hotels (`search_hotels`)

Find available hotels in a specific city.

**Parameters:**

- `cityCode` (required): City code (e.g., "PAR", "NYC", "LON")
- `checkInDate` (required): Check-in date in YYYY-MM-DD format
- `checkOutDate` (required): Check-out date in YYYY-MM-DD format
- `adults` (optional): Number of adult guests (default: "2")
- `max` (optional): Maximum results to return (default: "10")

**Example:**

```json
{
  "cityCode": "PAR",
  "checkInDate": "2024-06-01",
  "checkOutDate": "2024-06-03",
  "adults": "2"
}
```

### 3. Get Travel Recommendations (`get_travel_recommendations`)

Get personalized travel tips and activity suggestions.

**Parameters:**

- `destination` (required): Destination city or country
- `interests` (optional): Array of interests (e.g., ["culture", "food", "adventure"])
- `budget` (optional): Budget level ("budget", "mid-range", "luxury")
- `duration` (optional): Trip duration (e.g., "3 days", "1 week")

**Example:**

```json
{
  "destination": "Paris",
  "interests": ["culture", "food"],
  "budget": "mid-range",
  "duration": "3 days"
}
```

## Usage with MCP Clients

This server implements the Model Context Protocol and can be used with any MCP-compatible client. The server communicates via stdio transport.

### Example MCP Client Configuration

```json
{
  "mcpServers": {
    "amadeus": {
      "command": "node",
      "args": ["/path/to/amadeus-mcp/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic restarting during development.

### Testing

```bash
npm test
```

The test script validates all tool endpoints and provides sample responses.

### Project Structure

```
amadeus-mcp/
├── comprehensive-server.js # 🚀 COMPREHENSIVE MCP server (17 tools)
├── simple-server.js       # Basic MCP server (3 tools)
├── server.js              # Original MCP server (needs SDK compatibility fix)
├── amadeus-client.js      # Amadeus API client wrapper
├── config.js              # Configuration management
├── setup.js               # Interactive setup script
├── package.json           # Dependencies and scripts
├── env.example            # Environment variables template
├── COMPREHENSIVE-API-LIST.md # Complete API documentation
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **"API credentials required" error**

   - Run `npm run setup` to configure your credentials
   - Ensure your `.env` file exists and contains valid credentials

2. **"Module not found" errors**

   - Run `npm install` to install dependencies
   - Ensure you're using Node.js 18+

3. **Amadeus API errors**
   - Verify your credentials are correct
   - Check if you're using the right environment (test vs live)
   - Ensure your Amadeus account is active

### Debug Mode

Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Check the troubleshooting section above
- Review Amadeus API documentation
- Open an issue on GitHub

## Changelog

### v1.0.0

- Initial release
- Flight search functionality
- Hotel search functionality
- Travel recommendations
- MCP protocol implementation
