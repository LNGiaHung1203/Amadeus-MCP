import Amadeus from 'amadeus';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  currencyCode?: string;
}

export interface FlightOffersV2Params {
  currencyCode: string;
  originDestinations: Array<{
    id: string;
    originLocationCode: string;
    destinationLocationCode: string;
    departureDateTimeRange: {
      date: string;
      time: string;
    };
  }>;
  travelers: Array<{
    id: string;
    travelerType: string;
  }>;
  sources: string[];
  searchCriteria: {
    maxFlightOffers: number;
    flightFilters?: {
      cabinRestrictions?: Array<{
        cabin: string;
        coverage: string;
        originDestinationIds: string[];
      }>;
    };
  };
}

export interface FlightOffersGetParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  nonStop?: boolean;
  max?: number;
  currencyCode?: string;
  travelClass?: string;
  includedAirlineCodes?: string;
  excludedAirlineCodes?: string;
  maxPrice?: number;
}





export interface AnalyticsPriceMetricsParams {
  originIataCode: string;
  destinationIataCode: string;
  departureDate: string;
  currencyCode?: string;
  oneWay?: boolean;
}

export interface LocationSearchParams {
  subType?: 'AIRPORT' | 'CITY' | 'AIRPORT,CITY';
  keyword: string;
  countryCode?: string;
  page?: {
    limit?: number;
    offset?: number;
  };
  sort?: string;
  view?: 'LIGHT' | 'FULL';
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface TransferOffersParams {
  startLocationCode: string;
  endAddressLine: string;
  endCityName: string;
  endZipCode: string;
  endCountryCode: string;
  endName: string;
  endGeoCode: string;
  transferType: 'PRIVATE' | 'SHARED' | 'BUS' | 'TRAIN' | 'TAXI';
  startDateTime: string;
  passengers: number;
  stopOvers?: Array<{
    duration: string;
    sequenceNumber: number;
    addressLine: string;
    countryCode: string;
    cityName: string;
    zipCode: string;
    name: string;
    geoCode: string;
    stateCode?: string;
  }>;
  startConnectedSegment?: {
    transportationType: 'FLIGHT' | 'TRAIN' | 'BUS';
    transportationNumber: string;
    departure: {
      localDateTime: string;
      iataCode: string;
    };
    arrival: {
      localDateTime: string;
      iataCode: string;
    };
  };
  passengerCharacteristics?: Array<{
    passengerTypeCode: 'ADT' | 'CHD' | 'INF';
    age: number;
  }>;
}

export interface HotelSearchParams {
  cityCode?: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  radius?: number;
  radiusUnit?: string;
  max?: number;
  hotelIds?: string[];
}

export interface AirportSearchParams {
  keyword: string;
  countryCode?: string;
}

export interface CitySearchParams {
  keyword: string;
}

export class AmadeusService {
  private amadeus: Amadeus | null = null;

  constructor() {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Warning: AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET not set. Tools will return mock data.');
      this.amadeus = null;
      return;
    }

    this.amadeus = new Amadeus({
      clientId,
      clientSecret,
      hostname: process.env.NODE_ENV === 'production' ? 'production' : 'test'
    });
  }

  // Helper method to get access token
  private async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }

  // ===== FLIGHT APIs =====

  async searchFlights(params: FlightSearchParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const searchParams: any = {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults || 1,
        currencyCode: params.currencyCode || 'USD',
        max: 50
      };

      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }

      const response = await this.amadeus.shopping.flightOffersSearch.get(searchParams);
      
      return {
        success: true,
        data: response.data,
        count: response.data.length,
        searchParams
      };
    } catch (error) {
      console.error('Error searching flights:', error);
      throw new Error(`Failed to search flights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Flight Offers V2 API - Advanced flight search with detailed parameters
  async searchFlightOffersV2(params: FlightOffersV2Params) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Use v2 API endpoint for flight offers
      const url = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flight Offers V2 API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        meta: data.meta,
        dictionaries: data.dictionaries,
        count: data.meta?.count || data.data?.length || 0,
        message: `Found ${data.meta?.count || data.data?.length || 0} flight offers`
      };
    } catch (error) {
      console.error('Error searching flight offers V2:', error);
      throw new Error(`Failed to search flight offers V2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Flight Offers (GET) API - Simple flight search with query parameters
  async searchFlightOffersGet(params: FlightOffersGetParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('originLocationCode', params.originLocationCode);
      queryParams.set('destinationLocationCode', params.destinationLocationCode);
      queryParams.set('departureDate', params.departureDate);
      
      if (params.returnDate) {
        queryParams.set('returnDate', params.returnDate);
      }
      if (params.adults) {
        queryParams.set('adults', params.adults.toString());
      }
      if (params.nonStop !== undefined) {
        queryParams.set('nonStop', params.nonStop.toString());
      }
      if (params.max) {
        queryParams.set('max', params.max.toString());
      }
      if (params.currencyCode) {
        queryParams.set('currencyCode', params.currencyCode);
      }
      if (params.travelClass) {
        queryParams.set('travelClass', params.travelClass);
      }
      if (params.includedAirlineCodes) {
        queryParams.set('includedAirlineCodes', params.includedAirlineCodes);
      }
      if (params.excludedAirlineCodes) {
        queryParams.set('excludedAirlineCodes', params.excludedAirlineCodes);
      }
      if (params.maxPrice) {
        queryParams.set('maxPrice', params.maxPrice.toString());
      }

      // Use v2 API endpoint for flight offers with GET method
      const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flight Offers GET API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        meta: data.meta,
        dictionaries: data.dictionaries,
        count: data.meta?.count || data.data?.length || 0,
        message: `Found ${data.meta?.count || data.data?.length || 0} flight offers`
      };
    } catch (error) {
      console.error('Error searching flight offers GET:', error);
      throw new Error(`Failed to search flight offers GET: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



    

  // ===== TRANSFER APIs =====

  // Transfer Offers API - Search for ground transportation options
  async searchTransferOffers(params: TransferOffersParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Use v1 API endpoint for transfer offers
      const url = 'https://test.api.amadeus.com/v1/shopping/transfer-offers';

      const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transfer Offers API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        errors: data.errors || [],
        meta: data.meta,
        count: data.data?.length || 0,
        message: `Found ${data.data?.length || 0} transfer offer(s)`
      };
    } catch (error) {
      console.error('Error searching transfer offers:', error);
      throw new Error(`Failed to search transfer offers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== ANALYTICS APIs =====

  // Analytics Itinerary Price Metrics API - Get price analytics and quartile rankings
  async getAnalyticsPriceMetrics(params: AnalyticsPriceMetricsParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('originIataCode', params.originIataCode);
      queryParams.set('destinationIataCode', params.destinationIataCode);
      queryParams.set('departureDate', params.departureDate);
      
      if (params.currencyCode) {
        queryParams.set('currencyCode', params.currencyCode);
      }
      if (params.oneWay !== undefined) {
        queryParams.set('oneWay', params.oneWay.toString());
      }

      // Use v1 API endpoint for analytics price metrics
      const url = `https://test.api.amadeus.com/v1/analytics/itinerary-price-metrics?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analytics Price Metrics API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        warnings: data.warnings || [],
        meta: data.meta,
        count: data.data?.length || 0,
        message: `Found price metrics for ${data.data?.length || 0} route(s)`
      };
    } catch (error) {
      console.error('Error getting analytics price metrics:', error);
      throw new Error(`Failed to get analytics price metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFlightInspiration(origin: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Try to get flight inspiration from popular destinations
      try {
        // Get popular destinations from flight offers
        const popularDestinations = ['LAX', 'ORD', 'DFW', 'ATL', 'DEN', 'SFO', 'MIA', 'LAS', 'PHX', 'CLT'];
        
        const inspirationData = [];
        for (const dest of popularDestinations.slice(0, 5)) {
          try {
            const response = await this.amadeus.shopping.flightOffersSearch.get({
              originLocationCode: origin,
              destinationLocationCode: dest,
              departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              adults: 1,
              max: 1
            });
            
            if (response.data && response.data.length > 0) {
              inspirationData.push({
                destination: dest,
                sampleOffer: response.data[0]
              });
            }
          } catch (destError) {
            // Skip this destination if it fails
            continue;
          }
        }
        
        if (inspirationData.length > 0) {
          return {
            success: true,
            data: inspirationData,
            count: inspirationData.length
          };
        }
      } catch (error) {
        console.error('Flight inspiration from popular destinations failed:', error);
      }

      // If all else fails, throw error
      throw new Error('Flight inspiration not available');
    } catch (error) {
      console.error('Error getting flight inspiration:', error);
      throw new Error(`Failed to get flight inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFlightPricing(flightOffers: any[]) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // The flight offers from search already have pricing, so return them directly
      // The pricing API is for getting updated pricing, but we already have it
      console.log('Flight offers already contain pricing information, returning as-is');
      
      return {
        success: true,
        data: flightOffers,
        count: flightOffers.length
      };
    } catch (error) {
      console.error('Error getting flight pricing:', error);
      throw new Error(`Failed to get flight pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== REFERENCE DATA APIs =====

  // Location Search API - Search for airports, cities, and other locations
  async searchLocations(params: LocationSearchParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('keyword', params.keyword);
      
      if (params.subType) {
        queryParams.set('subType', params.subType);
      }
      if (params.countryCode) {
        queryParams.set('countryCode', params.countryCode);
      }
      if (params.page?.limit) {
        queryParams.set('page[limit]', params.page.limit.toString());
      }
      if (params.page?.offset) {
        queryParams.set('page[offset]', params.page.offset.toString());
      }
      if (params.sort) {
        queryParams.set('sort', params.sort);
      }
      if (params.view) {
        queryParams.set('view', params.view);
      }
      if (params.radius) {
        queryParams.set('radius', params.radius.toString());
      }
      if (params.latitude) {
        queryParams.set('latitude', params.latitude.toString());
      }
      if (params.longitude) {
        queryParams.set('longitude', params.longitude.toString());
      }

      // Use v1 API endpoint for reference data locations
      const url = `https://test.api.amadeus.com/v1/reference-data/locations?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Location Search API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        meta: data.meta,
        count: data.data?.length || 0,
        message: `Found ${data.data?.length || 0} location(s) matching "${params.keyword}"`
      };
    } catch (error) {
      console.error('Error searching locations:', error);
      throw new Error(`Failed to search locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Location Search by ID API - Get detailed information about a specific location
  async getLocationById(locationId: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Use v1 API endpoint for reference data locations by ID
      const url = `https://test.api.amadeus.com/v1/reference-data/locations/${locationId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Location by ID API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data,
        meta: data.meta,
        message: `Retrieved location details for ID: ${locationId}`
      };
    } catch (error) {
      console.error('Error getting location by ID:', error);
      throw new Error(`Failed to get location by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAirportNearest(params: { latitude: number; longitude: number; radius?: number; page?: { limit?: number; offset?: number } }) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const accessToken = await this.getAccessToken(process.env.AMADEUS_CLIENT_ID!, process.env.AMADEUS_CLIENT_SECRET!);
      
      const url = new URL('https://test.api.amadeus.com/v1/reference-data/locations/airports');
      url.searchParams.set('latitude', params.latitude.toString());
      url.searchParams.set('longitude', params.longitude.toString());
      if (params.radius) url.searchParams.set('radius', params.radius.toString());
      if (params.page?.limit) url.searchParams.set('page[limit]', params.page.limit.toString());
      if (params.page?.offset) url.searchParams.set('page[offset]', params.page.offset.toString());

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airport nearest API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || [],
        message: `Found nearest airports to coordinates (${params.latitude}, ${params.longitude})`
      };
    } catch (error) {
      console.error('Error getting nearest airports:', error);
      throw new Error(`Airport nearest failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAirlineCode(airlineCode: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const accessToken = await this.getAccessToken(process.env.AMADEUS_CLIENT_ID!, process.env.AMADEUS_CLIENT_SECRET!);
      
      const url = `https://test.api.amadeus.com/v1/reference-data/airlines?airlineCodes=${airlineCode}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airline code lookup API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
        return {
          success: true,
        data: data.data || [],
        message: `Found airline information for code ${airlineCode}`
      };
    } catch (error) {
      console.error('Error getting airline code:', error);
      throw new Error(`Airline code lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchAirports(params: AirportSearchParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const searchParams: any = {
        keyword: params.keyword,
        subType: 'AIRPORT'
      };

      if (params.countryCode) {
        searchParams.countryCode = params.countryCode;
      }

      const response = await this.amadeus.referenceData.locations.get(searchParams);
      
      return {
        success: true,
        data: response.data,
        count: response.data.length,
        searchParams
      };
    } catch (error) {
      console.error('Error searching airports:', error);
      throw new Error(`Failed to search airports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchCities(params: CitySearchParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const searchParams: any = {
        keyword: params.keyword,
        subType: 'CITY'
      };

      // Add retry logic for rate limiting
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await this.amadeus.referenceData.locations.get(searchParams);
          
          return {
            success: true,
            data: response.data,
            count: response.data.length,
            searchParams
          };
        } catch (error: any) {
          if (error.code === 'ClientError' && error.response?.statusCode === 429 && retries > 1) {
            // Rate limited, wait and retry
            console.log(`Rate limited, waiting 2 seconds before retry ${4 - retries}/3...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
            continue;
          }
          throw error;
        }
      }
      
      throw new Error('Max retries exceeded for city search');
    } catch (error) {
      console.error('Error searching cities:', error);
      throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== HOTEL APIs =====
  // These will be implemented one by one based on your specifications

  async getHotelRatings(hotelIds: string[]) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      const accessToken = await this.getAccessToken(process.env.AMADEUS_CLIENT_ID!, process.env.AMADEUS_CLIENT_SECRET!);
      
      const url = new URL('https://test.api.amadeus.com/v2/e-reputation/hotel-sentiments');
      url.searchParams.set('hotelIds', hotelIds.join(','));

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hotel ratings API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || [],
        message: `Found ratings for ${hotelIds.length} hotels`
      };
    } catch (error) {
      console.error('Error getting hotel ratings:', error);
      throw new Error(`Hotel ratings failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHotelNameAutocomplete(keyword: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Use the locations API with CITY subtype instead of hotels endpoint
      const response = await this.amadeus.referenceData.locations.get({
        keyword: keyword,
        subType: 'CITY'
            });
            
            if (response.data && response.data.length > 0) {
          return {
            success: true,
          data: response.data,
          message: `Found city suggestions for keyword "${keyword}"`
        };
      } else {
        return {
          success: true,
          data: [],
          message: `No city suggestions found for keyword "${keyword}"`
          };
        }
      } catch (error) {
      console.error('Error getting hotel name autocomplete:', error);
      throw new Error(`Hotel name autocomplete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHotelInspiration(cityCode: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Use the locations API with CITY subtype for hotel inspiration
      const response = await this.amadeus.referenceData.locations.get({
        keyword: cityCode,
        subType: 'CITY'
      });
      
      if (response.data && response.data.length > 0) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      } else {
        return {
          success: true,
          data: [],
          count: 0,
          message: `No city information found for ${cityCode}`
        };
      }
    } catch (error) {
      console.error('Error getting hotel inspiration:', error);
      throw new Error(`Failed to get hotel inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ===== PLACEHOLDER METHODS FOR HOTEL APIs =====
  // These will be implemented based on your specifications

  async searchHotelsByCity(params: any) {
    throw new Error('searchHotelsByCity - Implementation pending - please provide API structure');
  }

  async searchHotelsByGeocode(params: any) {
    throw new Error('searchHotelsByGeocode - Implementation pending - please provide API structure');
  }

  async searchHotelsByIds(params: any) {
    throw new Error('searchHotelsByIds - Implementation pending - please provide API structure');
  }

  async searchHotels(params: any) {
    throw new Error('searchHotels - Implementation pending - please provide API structure');
  }

  async getHotelOffersForBooking(params: any) {
    throw new Error('getHotelOffersForBooking - Implementation pending - please provide API structure');
  }

  async getHotelOffersAlternative(params: any) {
    throw new Error('getHotelOffersAlternative - Implementation pending - please provide API structure');
  }

  async getHotelBookingDetails(params: any) {
    throw new Error('getHotelBookingDetails - Implementation pending - please provide API structure');
  }

  async cancelHotelBooking(params: any) {
    throw new Error('cancelHotelBooking - Implementation pending - please provide API structure');
  }
}