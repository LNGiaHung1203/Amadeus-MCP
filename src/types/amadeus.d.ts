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
    };
  }
}
