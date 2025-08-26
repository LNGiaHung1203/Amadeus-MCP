# Quick Setup Guide

## 🚀 Get Your Amadeus MCP Server Running in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Credentials

```bash
npm run setup
```

Follow the prompts to enter your Amadeus API credentials.

### 3. Test the Server

```bash
npm test
```

### 4. Start the Server

```bash
npm start
```

## 🔑 Getting Amadeus API Credentials

1. Go to [Amadeus Developers](https://developers.amadeus.com/)
2. Create an account and log in
3. Create a new application
4. Copy your Client ID and Client Secret
5. Use "test" environment for sandbox testing

## 📋 Available Tools

- **`search_flights`** - Find flights between airports
- **`search_hotels`** - Find hotels in cities
- **`get_travel_recommendations`** - Get travel tips and activities

## 🔧 MCP Client Configuration

Add this to your MCP client config:

```json
{
  "mcpServers": {
    "amadeus": {
      "command": "node",
      "args": ["/path/to/amadeus-mcp/simple-server.js"]
    }
  }
}
```

## ✅ You're Ready!

Your Amadeus MCP server is now working and can be used by any MCP-compatible client!
