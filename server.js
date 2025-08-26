import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import amadeus from './amadeus-client.js';

// Initialize the MCP server
const server = new Server({
  name: 'travel-agent-mcp',
  version: '1.0.0',
});

// Define available tools
const tools = [
  {
    name: 'search_flights',
    description: 'Search for available flights between airports using Amadeus API',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport code (e.g., "NYC", "LAX", "LHR")'
        },
        destination: {
          type: 'string',
          description: 'Destination airport code (e.g., "LAX", "NYC", "CDG")'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in YYYY-MM-DD format'
        },
        returnDate: {
          type: 'string',
          description: 'Return date in YYYY-MM-DD format (optional for one-way flights)'
        },
        adults: {
          type: 'string',
          description: 'Number of adult passengers (default: "1")'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "10")'
        }
      },
      required: ['origin', 'destination', 'departureDate']
    }
  },
  {
    name: 'search_hotels',
    description: 'Search for available hotels in a city using Amadeus API',
    inputSchema: {
      type: 'object',
      properties: {
        cityCode: {
          type: 'string',
          description: 'City code (e.g., "PAR", "NYC", "LON", "TOK")'
        },
        checkInDate: {
          type: 'string',
          description: 'Check-in date in YYYY-MM-DD format'
        },
        checkOutDate: {
          type: 'string',
          description: 'Check-out date in YYYY-MM-DD format'
        },
        adults: {
          type: 'string',
          description: 'Number of adult guests (default: "2")'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "10")'
        }
      },
      required: ['cityCode', 'checkInDate', 'checkOutDate']
    }
  },
  {
    name: 'get_travel_recommendations',
    description: 'Get travel recommendations and tips for destinations',
    inputSchema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Destination city or country'
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of interests (e.g., ["culture", "food", "adventure"])'
        },
        budget: {
          type: 'string',
          description: 'Budget level (e.g., "budget", "mid-range", "luxury")'
        },
        duration: {
          type: 'string',
          description: 'Trip duration (e.g., "3 days", "1 week")'
        }
      },
      required: ['destination']
    }
  }
];

// Register tools with the server
server.setRequestHandler('tools/list', async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'search_flights':
        return await handleFlightSearch(args);
      case 'search_hotels':
        return await handleHotelSearch(args);
      case 'get_travel_recommendations':
        return await handleGetTravelRecommendations(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Flight search handler
async function handleFlightSearch(args) {
  const { origin, destination, departureDate, returnDate, adults, max } = args;
  
  console.log(`🔍 Searching flights: ${origin} → ${destination} on ${departureDate}`);
  
  try {
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults || '1',
      max: max || '10'
    };
    
    if (returnDate) {
      searchParams.returnDate = returnDate;
    }
    
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
    
    const flights = response.data.map(flight => ({
      id: flight.id,
      price: flight.price.total,
      currency: flight.price.currency,
      airline: flight.itineraries[0].segments[0].carrierCode,
      flightNumber: flight.itineraries[0].segments[0].number,
      departure: {
        airport: flight.itineraries[0].segments[0].departure.iataCode,
        time: flight.itineraries[0].segments[0].departure.at
      },
      arrival: {
        airport: flight.itineraries[0].segments[0].arrival.iataCode,
        time: flight.itineraries[0].segments[0].arrival.at
      },
      duration: flight.itineraries[0].duration,
      stops: flight.itineraries[0].segments.length - 1
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${flights.length} flights from ${origin} to ${destination}:\n\n${flights.map(f => 
            `✈️ ${f.airline}${f.flightNumber} - ${f.departure.airport} → ${f.arrival.airport}\n` +
            `   💰 $${f.price} | ⏱️ ${f.duration} | 🛑 ${f.stops} stops`
          ).join('\n\n')}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Flight search failed: ${error.message}`);
  }
}

// Hotel search handler
async function handleHotelSearch(args) {
  const { cityCode, checkInDate, checkOutDate, adults, max } = args;
  
  console.log(`🏨 Searching hotels in ${cityCode} from ${checkInDate} to ${checkOutDate}`);
  
  try {
    const response = await amadeus.shopping.hotelOffersSearch.get({
      cityCode,
      checkInDate,
      checkOutDate,
      adults: adults || '2',
      max: max || '10'
    });
    
    const hotels = response.data.map(hotel => ({
      id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      rating: hotel.hotel.rating,
      address: hotel.hotel.address
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${hotels.length} hotels in ${cityCode}:\n\n${hotels.map(h => 
            `🏨 ${h.name} (${h.rating || 'N/A'}⭐)\n` +
            `   📍 ${h.address.cityName}, ${h.address.countryCode}`
          ).join('\n\n')}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Hotel search failed: ${error.message}`);
  }
}

// Travel recommendations handler
async function handleGetTravelRecommendations(args) {
  const { destination, interests = [], budget, duration } = args;
  
  console.log(`💡 Getting travel recommendations for ${destination}`);
  
  const destinationRecommendations = {
    'Paris': {
      activities: [
        'Visit the Eiffel Tower and enjoy the city views',
        'Explore the Louvre Museum and see the Mona Lisa',
        'Walk along the Champs-Élysées and shop',
        'Take a Seine River cruise to see the city from water',
        'Visit Notre-Dame Cathedral and the Latin Quarter',
        'Explore Montmartre and see the Sacré-Cœur'
      ],
      tips: [
        'Book museum tickets online to avoid long queues',
        'Use the Paris Metro for efficient transportation',
        'Try authentic French cuisine at local bistros',
        'Visit popular attractions early morning or late evening',
        'Learn basic French phrases for better interactions'
      ]
    },
    'New York': {
      activities: [
        'Visit Times Square and Broadway',
        'Explore Central Park and its attractions',
        'See the Statue of Liberty and Ellis Island',
        'Visit the Metropolitan Museum of Art',
        'Walk across the Brooklyn Bridge',
        'Explore the High Line and Chelsea Market'
      ],
      tips: [
        'Get a MetroCard for subway and bus transportation',
        'Book Broadway show tickets in advance',
        'Visit museums on free admission days',
        'Use the Staten Island Ferry for free Statue of Liberty views',
        'Explore different neighborhoods for authentic experiences'
      ]
    },
    'London': {
      activities: [
        'Visit the Tower of London and see the Crown Jewels',
        'Explore the British Museum',
        'See Big Ben and the Houses of Parliament',
        'Visit Buckingham Palace and watch the Changing of the Guard',
        'Take a ride on the London Eye',
        'Explore the West End and see a show'
      ],
      tips: [
        'Get an Oyster card for public transportation',
        'Book attractions online for better prices',
        'Visit museums (many are free)',
        'Use the London Underground efficiently',
        'Check the weather and bring appropriate clothing'
      ]
    }
  };
  
  const recommendations = destinationRecommendations[destination] || {
    activities: [
      'Visit local museums and cultural sites',
      'Try authentic local cuisine',
      'Explore historical landmarks',
      'Take a guided city tour',
      'Visit local markets and shops',
      'Experience local festivals and events'
    ],
    tips: [
      'Book attractions in advance to avoid queues',
      'Use public transportation for cost savings',
      'Check local weather forecasts',
      'Learn basic local phrases',
      'Keep emergency contact numbers handy',
      'Research local customs and etiquette'
    ]
  };
  
  let responseText = `Travel recommendations for ${destination}:\n\n`;
  
  if (interests && interests.length > 0) {
    responseText += `Based on your interests: ${interests.join(', ')}\n\n`;
  }
  
  if (budget) {
    responseText += `Budget level: ${budget}\n\n`;
  }
  
  if (duration) {
    responseText += `Trip duration: ${duration}\n\n`;
  }
  
  responseText += `🎯 Suggested Activities:\n${recommendations.activities.map(a => `   • ${a}`).join('\n')}\n\n`;
  responseText += `💡 Travel Tips:\n${recommendations.tips.map(t => `   • ${t}`).join('\n')}`;
  
  return {
    content: [
      {
        type: 'text',
        text: responseText
      }
    ]
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🚀 Travel Agent MCP Server started');
  console.log('📋 Available tools:', tools.map(t => t.name).join(', '));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { server, tools };
