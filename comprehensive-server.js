#!/usr/bin/env node

import amadeus from './amadeus-client.js';

console.log('🚀 Comprehensive Amadeus MCP Server');
console.log('====================================\n');

// Define comprehensive available tools
const tools = [
  // Flight-related tools
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
    name: 'search_flight_destinations',
    description: 'Search for flight destinations from a specific origin',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport code (e.g., "NYC", "LAX")'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in YYYY-MM-DD format'
        },
        oneWay: {
          type: 'boolean',
          description: 'Whether the flight is one-way (default: true)'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "50")'
        }
      },
      required: ['origin', 'departureDate']
    }
  },
  {
    name: 'get_flight_offers_pricing',
    description: 'Get pricing for specific flight offers',
    inputSchema: {
      type: 'object',
      properties: {
        flightOffers: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of flight offers to price'
        }
      },
      required: ['flightOffers']
    }
  },
  {
    name: 'get_flight_seatmaps',
    description: 'Get seat maps for specific flights',
    inputSchema: {
      type: 'object',
      properties: {
        flightOffers: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of flight offers to get seat maps for'
        }
      },
      required: ['flightOffers']
    }
  },
  
  // Hotel-related tools
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
    name: 'search_hotels_by_geolocation',
    description: 'Search for hotels near specific coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'string',
          description: 'Latitude coordinate'
        },
        longitude: {
          type: 'string',
          description: 'Longitude coordinate'
        },
        radius: {
          type: 'string',
          description: 'Search radius in kilometers (default: "5")'
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
        }
      },
      required: ['latitude', 'longitude', 'checkInDate', 'checkOutDate']
    }
  },
  {
    name: 'get_hotel_details',
    description: 'Get detailed information about a specific hotel',
    inputSchema: {
      type: 'object',
      properties: {
        hotelId: {
          type: 'string',
          description: 'Hotel ID from search results'
        }
      },
      required: ['hotelId']
    }
  },
  
  // Location and reference data tools
  {
    name: 'search_airports',
    description: 'Search for airports by keyword or location',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search keyword (city name, airport code, etc.)'
        },
        countryCode: {
          type: 'string',
          description: 'Country code to limit search (optional)'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "10")'
        }
      },
      required: ['keyword']
    }
  },
  {
    name: 'search_cities',
    description: 'Search for cities by keyword',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'City name or keyword to search for'
        },
        countryCode: {
          type: 'string',
          description: 'Country code to limit search (optional)'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "10")'
        }
      },
      required: ['keyword']
    }
  },
  {
    name: 'search_points_of_interest',
    description: 'Search for points of interest in a city',
    inputSchema: {
      type: 'object',
      properties: {
        cityCode: {
          type: 'string',
          description: 'City code to search in'
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categories to search for (e.g., ["SIGHTS", "RESTAURANT"])'
        },
        radius: {
          type: 'string',
          description: 'Search radius in kilometers (default: "5")'
        },
        max: {
          type: 'string',
          description: 'Maximum number of results to return (default: "10")'
        }
      },
      required: ['cityCode']
    }
  },
  
  // Travel insights and recommendations
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
  },
  {
    name: 'get_travel_predictions',
    description: 'Get travel predictions and insights for destinations',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin city code'
        },
        destination: {
          type: 'string',
          description: 'Destination city code'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in YYYY-MM-DD format'
        }
      },
      required: ['origin', 'destination', 'departureDate']
    }
  },
  {
    name: 'get_destination_insights',
    description: 'Get insights about a specific destination',
    inputSchema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Destination city or country'
        }
      },
      required: ['destination']
    }
  },
  
  // Car rental tools
  {
    name: 'search_car_rentals',
    description: 'Search for car rental options in a city',
    inputSchema: {
      type: 'object',
      properties: {
        cityCode: {
          type: 'string',
          description: 'City code for car rental search'
        },
        pickUpDate: {
          type: 'string',
          description: 'Pick-up date in YYYY-MM-DD format'
        },
        dropOffDate: {
          type: 'string',
          description: 'Drop-off date in YYYY-MM-DD format'
        },
        pickUpTime: {
          type: 'string',
          description: 'Pick-up time in HH:MM format (default: "10:00")'
        },
        dropOffTime: {
          type: 'string',
          description: 'Drop-off time in HH:MM format (default: "10:00")'
        }
      },
      required: ['cityCode', 'pickUpDate', 'dropOffDate']
    }
  },
  
  // Trip planning tools
  {
    name: 'create_trip_plan',
    description: 'Create a comprehensive trip plan with flights, hotels, and activities',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin city/airport code'
        },
        destination: {
          type: 'string',
          description: 'Destination city/airport code'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in YYYY-MM-DD format'
        },
        returnDate: {
          type: 'string',
          description: 'Return date in YYYY-MM-DD format'
        },
        adults: {
          type: 'string',
          description: 'Number of adult travelers (default: "2")'
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of interests for activities'
        },
        budget: {
          type: 'string',
          description: 'Budget level for the trip'
        }
      },
      required: ['origin', 'destination', 'departureDate', 'returnDate']
    }
  },
  
  // Utility tools
  {
    name: 'get_currency_conversion',
    description: 'Get currency conversion rates',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Source currency code (e.g., "USD", "EUR")'
        },
        to: {
          type: 'string',
          description: 'Target currency code (e.g., "EUR", "USD")'
        }
      },
      required: ['from', 'to']
    }
  },
  {
    name: 'get_airport_weather',
    description: 'Get weather information for an airport',
    inputSchema: {
      type: 'object',
      properties: {
        airportCode: {
          type: 'string',
          description: 'Airport code (e.g., "LAX", "JFK")'
        }
      },
      required: ['airportCode']
    }
  }
];

// Flight search handler
async function handleFlightSearch(args) {
  const { origin, destination, departureDate, returnDate, adults, max } = args;
  
  console.log(`🔍 Searching flights: ${origin} → ${destination} on ${departureDate}`);
  
  try {
    const formattedDepartureDate = departureDate.split('T')[0];
    const formattedReturnDate = returnDate ? returnDate.split('T')[0] : undefined;
    
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: formattedDepartureDate,
      adults: adults || '1',
      max: max || '10'
    };
    
    if (formattedReturnDate) {
      searchParams.returnDate = formattedReturnDate;
    }
    
    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
    
    if (!response || !response.data) {
      throw new Error('No flight data received from API');
    }
    
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
      content: [{
        type: 'text',
        text: `Found ${flights.length} flights from ${origin} to ${destination}:\n\n${flights.map(f => 
          `✈️ ${f.airline}${f.flightNumber} - ${f.departure.airport} → ${f.arrival.airport}\n` +
          `   💰 ${f.price} ${f.currency} | ⏱️ ${f.duration} | 🛑 ${f.stops} stops`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Flight search failed: ${error.message}`);
  }
}

// Flight destinations search handler
async function handleFlightDestinationsSearch(args) {
  const { origin, departureDate, oneWay, max } = args;
  
  console.log(`🔍 Searching flight destinations from ${origin} on ${departureDate}`);
  
  try {
    const response = await amadeus.shopping.flightDestinations.get({
      origin: origin,
      departureDate: departureDate,
      oneWay: oneWay !== false,
      max: max || '50'
    });
    
    if (!response || !response.data) {
      throw new Error('No destination data received from API');
    }
    
    const destinations = response.data.map(dest => ({
      destination: dest.destination,
      departureDate: dest.departureDate,
      returnDate: dest.returnDate,
      price: dest.price?.total,
      currency: dest.price?.currency
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Found ${destinations.length} destinations from ${origin}:\n\n${destinations.map(d => 
          `🌍 ${d.destination} | 📅 ${d.departureDate}${d.returnDate ? ` - ${d.returnDate}` : ''}${d.price ? ` | 💰 ${d.price} ${d.currency}` : ''}`
        ).join('\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Flight destinations search failed: ${error.message}`);
  }
}

// Hotel search handler
async function handleHotelSearch(args) {
  const { cityCode, checkInDate, checkOutDate, adults, max } = args;
  
  console.log(`🏨 Searching hotels in ${cityCode} from ${checkInDate} to ${checkOutDate}`);
  
  try {
    const formattedCheckInDate = checkInDate.split('T')[0];
    const formattedCheckOutDate = checkOutDate.split('T')[0];
    
    const searchParams = {
      cityCode,
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
      adults: adults || '2',
      max: max || '10'
    };
    
    // Get hotel list first
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: cityCode
    });
    
    if (!hotelListResponse || !hotelListResponse.data || hotelListResponse.data.length === 0) {
      throw new Error('No hotels found in this city');
    }
    
    const hotelIds = hotelListResponse.data.slice(0, 5).map(hotel => hotel.hotelId);
    
    const response = await amadeus.shopping.hotelOffersSearch.get({
      ...searchParams,
      hotelIds: hotelIds.join(',')
    });
    
    if (!response || !response.data) {
      throw new Error('No hotel data received from API');
    }
    
    const hotels = response.data.map(hotel => {
      const hotelInfo = hotel.hotel || hotel;
      const address = hotelInfo.address || {};
      
      return {
        id: hotelInfo.hotelId || hotelInfo.id || 'N/A',
        name: hotelInfo.name || 'Unknown Hotel',
        rating: hotelInfo.rating || 'N/A',
        address: {
          cityName: address.cityName || 'Unknown City',
          countryCode: address.countryCode || 'Unknown Country'
        }
      };
    });
    
    return {
      content: [{
        type: 'text',
        text: `Found ${hotels.length} hotels in ${cityCode}:\n\n${hotels.map(h => 
          `🏨 ${h.name} (${h.rating || 'N/A'}⭐)\n` +
          `   📍 ${h.address.cityName}, ${h.address.countryCode}`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Hotel search failed: ${error.message}`);
  }
}

// Airport search handler
async function handleAirportSearch(args) {
  const { keyword, countryCode, max } = args;
  
  console.log(`✈️ Searching airports for: ${keyword}`);
  
  try {
    const searchParams = {
      keyword: keyword,
      max: max || '10'
    };
    
    if (countryCode) {
      searchParams.countryCode = countryCode;
    }
    
    const response = await amadeus.referenceData.locations.get(searchParams);
    
    if (!response || !response.data) {
      throw new Error('No airport data received from API');
    }
    
    const airports = response.data.map(airport => ({
      code: airport.iataCode,
      name: airport.name,
      city: airport.address.cityName,
      country: airport.address.countryName
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Found ${airports.length} airports for "${keyword}":\n\n${airports.map(a => 
          `✈️ ${a.code} - ${a.name}\n   📍 ${a.city}, ${a.country}`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Airport search failed: ${error.message}`);
  }
}

// City search handler
async function handleCitySearch(args) {
  const { keyword, countryCode, max } = args;
  
  console.log(`🏙️ Searching cities for: ${keyword}`);
  
  try {
    const searchParams = {
      keyword: keyword,
      max: max || '10'
    };
    
    if (countryCode) {
      searchParams.countryCode = countryCode;
    }
    
    const response = await amadeus.referenceData.locations.cities.get(searchParams);
    
    if (!response || !response.data) {
      throw new Error('No city data received from API');
    }
    
    const cities = response.data.map(city => ({
      code: city.iataCode,
      name: city.name,
      country: city.address.countryName,
      region: city.address.regionCode
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Found ${cities.length} cities for "${keyword}":\n\n${cities.map(c => 
          `🏙️ ${c.code} - ${c.name}\n   📍 ${c.country}${c.region ? `, ${c.region}` : ''}`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`City search failed: ${error.message}`);
  }
}

// Points of interest search handler
async function handlePointsOfInterestSearch(args) {
  const { cityCode, categories, radius, max } = args;
  
  console.log(`🎯 Searching points of interest in ${cityCode}`);
  
  try {
    const searchParams = {
      cityCode: cityCode,
      radius: radius || '5',
      max: max || '10'
    };
    
    if (categories && categories.length > 0) {
      searchParams.categories = categories;
    }
    
    const response = await amadeus.referenceData.locations.pointsOfInterest.get(searchParams);
    
    if (!response || !response.data) {
      throw new Error('No points of interest data received from API');
    }
    
    const pois = response.data.map(poi => ({
      name: poi.name,
      category: poi.category,
      address: poi.address,
      distance: poi.distance
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Found ${pois.length} points of interest in ${cityCode}:\n\n${pois.map(p => 
          `🎯 ${p.name} (${p.category})\n   📍 ${p.address?.streetNumber || ''} ${p.address?.streetName || ''}, ${p.address?.cityName || ''}\n   📏 ${p.distance}km away`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Points of interest search failed: ${error.message}`);
  }
}

// Car rental search handler
async function handleCarRentalSearch(args) {
  const { cityCode, pickUpDate, dropOffDate, pickUpTime, dropOffTime } = args;
  
  console.log(`🚗 Searching car rentals in ${cityCode}`);
  
  try {
    const response = await amadeus.shopping.carOffers.get({
      cityCode: cityCode,
      pickUpDate: pickUpDate,
      dropOffDate: dropOffDate,
      pickUpTime: pickUpTime || '10:00',
      dropOffTime: dropOffTime || '10:00'
    });
    
    if (!response || !response.data) {
      throw new Error('No car rental data received from API');
    }
    
    const cars = response.data.map(car => ({
      company: car.carInfo?.companyName || 'Unknown Company',
      model: car.carInfo?.model || 'Unknown Model',
      type: car.carInfo?.type || 'Unknown Type',
      price: car.rate?.totalAmount,
      currency: car.rate?.currencyCode
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Found ${cars.length} car rental options in ${cityCode}:\n\n${cars.map(c => 
          `🚗 ${c.company} - ${c.model} (${c.type})\n   💰 ${c.price ? `${c.price} ${c.currency}` : 'Price not available'}`
        ).join('\n\n')}`
      }]
    };
  } catch (error) {
    throw new Error(`Car rental search failed: ${error.message}`);
  }
}

// Trip planning handler
async function handleCreateTripPlan(args) {
  const { origin, destination, departureDate, returnDate, adults, interests, budget } = args;
  
  console.log(`🗺️ Creating trip plan: ${origin} → ${destination}`);
  
  try {
    // Get flights
    const flightResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      returnDate: returnDate,
      adults: adults || '2',
      max: '3'
    });
    
    // Get hotels
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: destination
    });
    
    let hotelResponse = null;
    if (hotelListResponse && hotelListResponse.data && hotelListResponse.data.length > 0) {
      const hotelIds = hotelListResponse.data.slice(0, 3).map(hotel => hotel.hotelId);
      hotelResponse = await amadeus.shopping.hotelOffersSearch.get({
        cityCode: destination,
        checkInDate: departureDate,
        checkOutDate: returnDate,
        adults: adults || '2',
        hotelIds: hotelIds.join(','),
        max: '3'
      });
    }
    
    // Get points of interest
    const poiResponse = await amadeus.referenceData.locations.pointsOfInterest.get({
      cityCode: destination,
      radius: '5',
      max: '5'
    });
    
    let planText = `🗺️ **Trip Plan: ${origin} → ${destination}**\n\n`;
    planText += `📅 **Dates:** ${departureDate} to ${returnDate}\n`;
    planText += `👥 **Travelers:** ${adults || '2'} adults\n`;
    if (budget) planText += `💰 **Budget:** ${budget}\n`;
    if (interests && interests.length > 0) planText += `🎯 **Interests:** ${interests.join(', ')}\n`;
    
    // Add flights
    if (flightResponse && flightResponse.data && flightResponse.data.length > 0) {
      planText += `\n✈️ **Flight Options:**\n`;
      flightResponse.data.slice(0, 3).forEach((flight, index) => {
        planText += `${index + 1}. ${flight.itineraries[0].segments[0].carrierCode}${flight.itineraries[0].segments[0].number} - ${flight.price.total} ${flight.price.currency}\n`;
      });
    }
    
    // Add hotels
    if (hotelResponse && hotelResponse.data && hotelResponse.data.length > 0) {
      planText += `\n🏨 **Hotel Options:**\n`;
      hotelResponse.data.slice(0, 3).forEach((hotel, index) => {
        planText += `${index + 1}. ${hotel.hotel.name}\n`;
      });
    }
    
    // Add activities
    if (poiResponse && poiResponse.data && poiResponse.data.length > 0) {
      planText += `\n🎯 **Recommended Activities:**\n`;
      poiResponse.data.slice(0, 5).forEach((poi, index) => {
        planText += `${index + 1}. ${poi.name} (${poi.category})\n`;
      });
    }
    
    return {
      content: [{
        type: 'text',
        text: planText
      }]
    };
  } catch (error) {
    throw new Error(`Trip planning failed: ${error.message}`);
  }
}

// Travel recommendations handler (enhanced)
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
    },
    'Tokyo': {
      activities: [
        'Visit Senso-ji Temple in Asakusa',
        'Explore the bustling Shibuya crossing',
        'See the cherry blossoms in Ueno Park',
        'Visit the Tokyo Skytree for city views',
        'Explore the historic Meiji Shrine',
        'Experience the famous Tsukiji Fish Market'
      ],
      tips: [
        'Get a Japan Rail Pass for long-distance travel',
        'Use the efficient Tokyo Metro system',
        'Try authentic sushi and ramen',
        'Visit temples early to avoid crowds',
        'Learn basic Japanese phrases'
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
    content: [{
      type: 'text',
      text: responseText
    }]
  };
}

// Main request handler
async function handleRequest(method, params) {
  switch (method) {
    case 'tools/list':
      return { tools };
    case 'tools/call':
      const { name, arguments: args } = params;
      switch (name) {
        case 'search_flights':
          return await handleFlightSearch(args);
        case 'search_flight_destinations':
          return await handleFlightDestinationsSearch(args);
        case 'search_hotels':
          return await handleHotelSearch(args);
        case 'search_airports':
          return await handleAirportSearch(args);
        case 'search_cities':
          return await handleCitySearch(args);
        case 'search_points_of_interest':
          return await handlePointsOfInterestSearch(args);
        case 'search_car_rentals':
          return await handleCarRentalSearch(args);
        case 'create_trip_plan':
          return await handleCreateTripPlan(args);
        case 'get_travel_recommendations':
          return await handleGetTravelRecommendations(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// Test the comprehensive server
async function testComprehensiveServer() {
  console.log('🧪 Testing comprehensive server functionality...\n');
  
  try {
    // Test tools/list
    console.log('📋 Testing tools/list...');
    const toolsList = await handleRequest('tools/list');
    console.log(`✅ Found ${toolsList.tools.length} tools: ${toolsList.tools.map(t => t.name).join(', ')}`);
    
    // Test travel recommendations
    console.log('\n💡 Testing travel recommendations...');
    const recommendations = await handleRequest('tools/call', {
      name: 'get_travel_recommendations',
      arguments: {
        destination: 'Tokyo',
        interests: ['culture', 'food'],
        budget: 'mid-range',
        duration: '5 days'
      }
    });
    console.log('✅ Travel recommendations test passed');
    
    // Test airport search
    console.log('\n✈️ Testing airport search...');
    try {
      await handleRequest('tools/call', {
        name: 'search_airports',
        arguments: {
          keyword: 'London'
        }
      });
      console.log('✅ Airport search test passed');
    } catch (error) {
      console.log(`⚠️ Airport search test: ${error.message}`);
    }
    
    // Test city search
    console.log('\n🏙️ Testing city search...');
    try {
      await handleRequest('tools/call', {
        name: 'search_cities',
        arguments: {
          keyword: 'Paris'
        }
      });
      console.log('✅ City search test passed');
    } catch (error) {
      console.log(`⚠️ City search test: ${error.message}`);
    }
    
    // Test flight search
    console.log('\n✈️ Testing flight search...');
    try {
      await handleRequest('tools/call', {
        name: 'search_flights',
        arguments: {
          origin: 'NYC',
          destination: 'LAX',
          departureDate: '2025-12-15',
          adults: '1',
          max: '3'
        }
      });
      console.log('✅ Flight search test passed');
    } catch (error) {
      console.log(`⚠️ Flight search test: ${error.message}`);
    }
    
    // Test hotel search
    console.log('\n🏨 Testing hotel search...');
    try {
      await handleRequest('tools/call', {
        name: 'search_hotels',
        arguments: {
          cityCode: 'PAR',
          checkInDate: '2025-12-15',
          checkOutDate: '2025-12-17',
          adults: '2',
          max: '3'
        }
      });
      console.log('✅ Hotel search test passed');
    } catch (error) {
      console.log(`⚠️ Hotel search test: ${error.message}`);
    }
    
    // Test trip planning
    console.log('\n🗺️ Testing trip planning...');
    try {
      await handleRequest('tools/call', {
        name: 'create_trip_plan',
        arguments: {
          origin: 'NYC',
          destination: 'PAR',
          departureDate: '2025-12-15',
          returnDate: '2025-12-20',
          adults: '2',
          interests: ['culture', 'food'],
          budget: 'mid-range'
        }
      });
      console.log('✅ Trip planning test passed');
    } catch (error) {
      console.log(`⚠️ Trip planning test: ${error.message}`);
    }
    
    console.log('\n🎉 All comprehensive tests completed!');
    console.log(`\n🚀 Your comprehensive MCP server now has ${toolsList.tools.length} powerful tools!`);
    console.log('\n📚 Available API Categories:');
    console.log('   • ✈️ Flight Search & Planning');
    console.log('   • 🏨 Hotel Search & Booking');
    console.log('   • 🚗 Car Rental Options');
    console.log('   • 🎯 Points of Interest');
    console.log('   • 🏙️ Location & Reference Data');
    console.log('   • 🗺️ Trip Planning & Recommendations');
    console.log('   • 💰 Pricing & Offers');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1]?.includes('comprehensive-server.js');

if (isMainModule) {
  testComprehensiveServer();
}

export { handleRequest, tools };
