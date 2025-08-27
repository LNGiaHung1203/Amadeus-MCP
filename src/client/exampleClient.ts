import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
  try {
    // Create client
    const client = new Client({
      name: "amadeus-example-client",
      version: "1.0.0"
    });

    // Connect using Streamable HTTP transport
    const transport = new StreamableHTTPClientTransport(
      new URL("http://localhost:3000/mcp")
    );

    await client.connect(transport);
    console.log("Connected to Amadeus MCP Server");

    // List available tools
    console.log("\n=== Available Tools ===");
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // List available resources
    console.log("\n=== Available Resources ===");
    const resources = await client.listResources();
    resources.resources.forEach(resource => {
      console.log(`- ${resource.uri}: ${resource.description}`);
    });

    // Example: Search for airports
    console.log("\n=== Example: Airport Search ===");
    try {
      const airportResult = await client.callTool({
        name: "airport_search",
        arguments: {
          keyword: "New York"
        }
      });
      console.log("Airport search result:", airportResult.content);
    } catch (error) {
      console.error("Error calling airport_search:", error);
    }

    // Example: Search for cities
    console.log("\n=== Example: City Search ===");
    try {
      const cityResult = await client.callTool({
        name: "city_search",
        arguments: {
          keyword: "Paris"
        }
      });
      console.log("City search result:", cityResult.content);
    } catch (error) {
      console.error("Error calling city_search:", error);
    }

    // Example: Read documentation resource
    console.log("\n=== Example: Read Documentation ===");
    try {
      const docResult = await client.readResource({
        uri: "https://developers.amadeus.com/"
      });
      if (docResult.contents && docResult.contents.length > 0) {
        const content = docResult.contents[0];
        if ('text' in content && typeof content.text === 'string') {
          console.log("Documentation content:", content.text.substring(0, 200) + "...");
        } else {
          console.log("Documentation content: Binary data");
        }
      } else {
        console.log("No documentation content found");
      }
    } catch (error) {
      console.error("Error reading documentation:", error);
    }

    // Example: Flight search (if you have valid airport codes)
    console.log("\n=== Example: Flight Search ===");
    try {
      const flightResult = await client.callTool({
        name: "flight_search",
        arguments: {
          origin: "JFK",
          destination: "LAX",
          departureDate: "2024-12-25",
          adults: 2,
          currencyCode: "USD"
        }
      });
      console.log("Flight search result:", flightResult.content);
    } catch (error) {
      console.error("Error calling flight_search:", error);
    }

    // Example: Hotel search (if you have valid city codes)
    console.log("\n=== Example: Hotel Search ===");
    try {
      const hotelResult = await client.callTool({
        name: "hotel_search",
        arguments: {
          cityCode: "NYC",
          checkInDate: "2024-12-24",
          checkOutDate: "2024-12-26",
          adults: 2,
          radius: 10
        }
      });
      console.log("Hotel search result:", hotelResult.content);
    } catch (error) {
      console.error("Error calling hotel_search:", error);
    }

    await client.close();
    console.log("\nClient disconnected");

  } catch (error) {
    console.error("Client error:", error);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
