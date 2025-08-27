import Amadeus from 'amadeus';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  currencyCode?: string;
}

export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  radius?: number;
  radiusUnit?: string;
  max?: number;
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

  // Removed getMockData - will return actual errors instead of fake data

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

  async searchHotels(params: HotelSearchParams) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Use the Hotel List API to find hotels in a city
      // This API is available at: /v1/reference-data/locations/hotels/by-city
      // But it's not exposed in the Node.js SDK, so we need to call it directly
      
      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      // First, get an access token
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
      const accessToken = tokenData.access_token;

      // Now call the Hotel List API
      const hotelListUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city');
      hotelListUrl.searchParams.set('cityCode', params.cityCode);
      hotelListUrl.searchParams.set('radius', params.radius.toString());
      hotelListUrl.searchParams.set('radiusUnit', params.radiusUnit);
      hotelListUrl.searchParams.set('hotelSource', 'ALL');

      const hotelResponse = await fetch(hotelListUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!hotelResponse.ok) {
        const errorText = await hotelResponse.text();
        throw new Error(`Hotel List API failed: ${hotelResponse.status} ${hotelResponse.statusText} - ${errorText}`);
      }

      const hotelData = await hotelResponse.json();
      
      return {
        success: true,
        data: hotelData.data || [],
        message: `Found ${hotelData.data?.length || 0} hotels in ${params.cityCode}`
      };

    } catch (error) {
      console.error('Error searching hotels:', error);
      throw new Error(`Hotel search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getHotelPricing(hotelOffers: any[]) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Hotel pricing API is not available
      throw new Error('Hotel pricing API not available');
    } catch (error) {
      console.error('Error getting hotel pricing:', error);
      throw new Error(`Failed to get hotel pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getHotelInspiration(cityCode: string) {
    try {
      if (!this.amadeus) {
        throw new Error('Amadeus credentials not configured');
      }

      // Try to get hotel inspiration from the locations API with different approaches
      try {
        // First try with POINT_OF_INTEREST subtype
        const response = await this.amadeus.referenceData.locations.get({
          keyword: cityCode,
          subType: 'POINT_OF_INTEREST'
        });
        
        if (response.data && response.data.length > 0) {
          return {
            success: true,
            data: response.data,
            count: response.data.length
          };
        }
      } catch (firstError) {
        console.error('POINT_OF_INTEREST search failed:', firstError);
      }

      // If that fails, try with a broader search
      try {
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
        }
      } catch (secondError) {
        console.error('CITY search failed:', secondError);
      }

      // If all else fails, throw error
      throw new Error('Hotel inspiration not available via locations API');
    } catch (error) {
      console.error('Error getting hotel inspiration:', error);
      throw new Error(`Failed to get hotel inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
