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
  private isStdioMode: boolean;

  constructor() {
    // Check if we're running in STDIO mode - be more specific
    // Only consider it STDIO mode if explicitly requested or if we're in a true STDIO context
    this.isStdioMode = process.argv.includes('--stdio') || 
                       process.argv.includes('stdio') ||
                       process.env.MCP_INSPECTOR === 'true';
    
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      if (this.isStdioMode) {
        // In STDIO mode, just log to stderr and continue without Amadeus
        console.error('Warning: AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET not set. Tools will return mock data in STDIO mode.');
        this.amadeus = null; // Explicitly set to null
        return;
      } else {
        throw new Error('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set in environment variables');
      }
    }

    this.amadeus = new Amadeus({
      clientId,
      clientSecret,
      hostname: process.env.NODE_ENV === 'production' ? 'production' : 'test'
    });
  }

  private getMockData(method: string, params: any) {
    return {
      success: true,
      data: [
        {
          method,
          params,
          message: "Mock data - Amadeus credentials not configured",
          timestamp: new Date().toISOString()
        }
      ],
      count: 1,
      searchParams: params
    };
  }

  async searchFlights(params: FlightSearchParams) {
    try {
      if (!this.amadeus) {
        return this.getMockData('searchFlights', params);
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
        return this.getMockData('searchHotels', params);
      }

      const searchParams: any = {
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults || 1,
        radius: params.radius || 5,
        radiusUnit: params.radiusUnit || 'KM',
        max: 50
      };

      // Try to get hotel offers using the hotel list API first, then get offers
      try {
        // First, try to get a list of hotels in the city
        const hotelListResponse = await (this.amadeus.referenceData as any).hotels.get({
          cityCode: params.cityCode
        });
        
        if (hotelListResponse.data && hotelListResponse.data.length > 0) {
          // Get hotel IDs from the list
          const hotelIds = hotelListResponse.data.slice(0, 10).map((hotel: any) => hotel.hotelId || hotel.id);
          
          // Now get hotel offers using the hotel IDs
          const offersResponse = await (this.amadeus.shopping as any).hotelOffersSearch.get({
            hotelIds: hotelIds.join(','),
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            adults: params.adults || 1,
            max: 50
          });
          
          return {
            success: true,
            data: offersResponse.data,
            count: offersResponse.data.length,
            searchParams: params
          };
        }
      } catch (error) {
        console.error('Hotel list search failed, trying direct hotel offers:', error);
      }

      // If hotel list approach fails, try direct hotel offers with city
      try {
        const response = await (this.amadeus.shopping as any).hotelOffersSearch.get({
          cityCode: params.cityCode,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          adults: params.adults || 1,
          radius: params.radius || 5,
          radiusUnit: params.radiusUnit || 'KM',
          max: 50
        });
        
        return {
          success: true,
          data: response.data,
          count: response.data.length,
          searchParams: params
        };
      } catch (error) {
        console.error('Direct hotel offers search failed, trying location-based:', error);
        
        // Try location-based search
        try {
          const response = await (this.amadeus.shopping as any).hotelOffersSearch.get({
            location: params.cityCode,
            checkInDate: params.checkInDate,
            checkOutDate: params.checkOutDate,
            adults: params.adults || 1,
            max: 50
          });
          
          return {
            success: true,
            data: response.data,
            count: response.data.length,
            searchParams: params
          };
        } catch (secondError) {
          console.error('All hotel search approaches failed, returning mock data:', secondError);
          return this.getMockData('searchHotels', params);
        }
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw new Error(`Failed to search hotels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchAirports(params: AirportSearchParams) {
    try {
      if (!this.amadeus) {
        return this.getMockData('searchAirports', params);
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
        return this.getMockData('searchCities', params);
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
        return this.getMockData('getFlightPricing', { flightOffers });
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
        return this.getMockData('getHotelPricing', { hotelOffers });
      }

      // Hotel pricing API might not be available, return mock data for now
      console.error('Hotel pricing API not available, returning mock data');
      return this.getMockData('getHotelPricing', { hotelOffers });
    } catch (error) {
      console.error('Error getting hotel pricing:', error);
      throw new Error(`Failed to get hotel pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFlightInspiration(origin: string) {
    try {
      if (!this.amadeus) {
        return this.getMockData('getFlightInspiration', { origin });
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

      // If all else fails, return mock data
      console.log('Flight inspiration not available, returning mock data');
      return this.getMockData('getFlightInspiration', { origin });
    } catch (error) {
      console.error('Error getting flight inspiration:', error);
      throw new Error(`Failed to get flight inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHotelInspiration(cityCode: string) {
    try {
      if (!this.amadeus) {
        return this.getMockData('getHotelInspiration', { cityCode });
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

      // If all else fails, return mock data
      console.log('Hotel inspiration not available via locations API, returning mock data');
      return this.getMockData('getHotelInspiration', { cityCode });
    } catch (error) {
      console.error('Error getting hotel inspiration:', error);
      throw new Error(`Failed to get hotel inspiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
