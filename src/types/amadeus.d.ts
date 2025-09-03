declare module 'amadeus' {
  export default class Amadeus {
    constructor(config: {
      clientId: string;
      clientSecret: string;
      hostname?: 'production' | 'test';
    });

    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<{ data: any[] }>;
      };
      flightOffers: {
        pricing: {
          post(data: string): Promise<{ data: any[] }>;
        };
      };
      flightDestinations: {
        get(params: any): Promise<{ data: any[] }>;
      };
      hotelOffersSearch: {
        get(params: any): Promise<{ data: any[] }>;
      };
      hotelOffers: {
        get(params: any): Promise<{ data: any[] }>;
        pricing: {
          post(data: string): Promise<{ data: any[] }>;
        };
      };
      // New Flight APIs
      flightOffers: {
        pricing: {
          post(data: string): Promise<{ data: any[] }>;
        };
      };
      // New Hotel APIs
      hotelOffers: {
        get(params: any): Promise<{ data: any[] }>;
        pricing: {
          post(data: string): Promise<{ data: any[] }>;
        };
      };
    };

    referenceData: {
      locations: {
        get(params: any): Promise<{ data: any[] }>;
      };
      // New Reference Data APIs
      airlines: {
        get(params: any): Promise<{ data: any[] }>;
      };
      airports: {
        get(params: any): Promise<{ data: any[] }>;
      };
    };

            // New APIs that need direct HTTP calls
        // These will be implemented using fetch() since they're not in SDK
        
        // Hotel Booking APIs
        hotelBooking: {
          // Get hotel offers for booking
          get(params: any): Promise<{ data: any[] }>;
          // Create hotel booking
          post(data: any): Promise<{ data: any }>;
          // Get booking details
          getById(bookingId: string): Promise<{ data: any }>;
          // Cancel booking
          delete(bookingId: string): Promise<{ data: any }>;
        };
      }
    }
