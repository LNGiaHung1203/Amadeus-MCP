#!/usr/bin/env tsx

import { AmadeusService } from './services/amadeusService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the project root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

interface TestResult {
  api: string;
  success: boolean;
  error?: string;
  data?: any;
  responseTime?: number;
}

class AmadeusAPITester {
  private amadeusService: AmadeusService;
  private results: TestResult[] = [];

  constructor() {
    this.amadeusService = new AmadeusService();
  }

  private async measureResponseTime<T>(fn: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
    const start = Date.now();
    const result = await fn();
    const responseTime = Date.now() - start;
    return { result, responseTime };
  }

  private logResult(result: TestResult) {
    const status = result.success ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${status} ${result.api}${time}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Show sample data for successful API calls
    if (result.success && result.data) {
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log(`   📊 Data Sample (${result.data.length} items):`);
        console.log(`   └─ First item:`, JSON.stringify(result.data[0], null, 2).substring(0, 500) + (JSON.stringify(result.data[0], null, 2).length > 500 ? '...' : ''));
      } else if (typeof result.data === 'object') {
        console.log(`   📊 Data:`, JSON.stringify(result.data, null, 2).substring(0, 500) + (JSON.stringify(result.data, null, 2).length > 500 ? '...' : ''));
      }
    }
    
    this.results.push(result);
  }

  async testFlightAPIs() {
    console.log('\n🛫 Testing Flight APIs...');
    
    // Use future dates for testing
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    const departureDate = futureDate.toISOString().split('T')[0];
    
    const returnDate = new Date(futureDate);
    returnDate.setDate(returnDate.getDate() + 5); // 5 days after departure
    const returnDateStr = returnDate.toISOString().split('T')[0];
    
    console.log(`Using dates: Departure: ${departureDate}, Return: ${returnDateStr}`);
    
    // Test Flight Offers Search
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.searchFlights({
          origin: 'NYC',
          destination: 'LAX',
          departureDate: departureDate,
          adults: 1,
          currencyCode: 'USD'
        })
      );
      
      this.logResult({
        api: 'Flight Offers Search',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Flight Offers Search',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Flight Offers Search with Return Date
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.searchFlights({
          origin: 'NYC',
          destination: 'LAX',
          departureDate: departureDate,
          returnDate: returnDateStr,
          adults: 2
        })
      );
      
      this.logResult({
        api: 'Flight Offers Search (Round Trip)',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Flight Offers Search (Round Trip)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Flight Inspiration
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.getFlightInspiration('NYC')
      );
      
      this.logResult({
        api: 'Flight Inspiration',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Flight Inspiration',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testHotelAPIs() {
    console.log('\n🏨 Testing Hotel APIs...');
    
    // Use future dates for testing
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    const checkInDate = futureDate.toISOString().split('T')[0];
    
    const checkOutDate = new Date(futureDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 days after check-in
    const checkOutDateStr = checkOutDate.toISOString().split('T')[0];
    
    console.log(`Using dates: Check-in: ${checkInDate}, Check-out: ${checkOutDateStr}`);
    
         // Test Hotel Search
     try {
       const { result, responseTime } = await this.measureResponseTime(() =>
         this.amadeusService.searchHotels({
           cityCode: 'PAR', // Use Paris for testing as it has known hotel data
           checkInDate: checkInDate,
           checkOutDate: checkOutDateStr,
           adults: 2,
           radius: 5,
           radiusUnit: 'KM'
         })
       );
       
       this.logResult({
         api: 'Hotel Search',
         success: result.success,
         data: result.data,
         responseTime
       });
     } catch (error) {
       this.logResult({
         api: 'Hotel Search',
         success: false,
         error: error instanceof Error ? error.message : 'Unknown error'
       });
     }

    // Test Hotel Inspiration
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.getHotelInspiration('NYC')
      );
      
      this.logResult({
        api: 'Hotel Inspiration',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Hotel Inspiration',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testReferenceDataAPIs() {
    console.log('\n📍 Testing Reference Data APIs...');
    
    // Test Airport Search
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.searchAirports({
          keyword: 'JFK',
          countryCode: 'US'
        })
      );
      
      this.logResult({
        api: 'Airport Search',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Airport Search',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test City Search
    try {
      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.searchCities({
          keyword: 'New York'
        })
      );
      
      this.logResult({
        api: 'City Search',
        success: result.success,
        data: result.data,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'City Search',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testPricingAPIs() {
    console.log('\n💰 Testing Pricing APIs...');
    
    // Test Flight Pricing (requires flight offers from search)
    try {
      // Get real flight offers from search to test pricing
      const flightSearchResult = await this.amadeusService.searchFlights({
        origin: 'NYC',
        destination: 'LAX',
        departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1
      });

      if (flightSearchResult.success && flightSearchResult.data && flightSearchResult.data.length > 0) {
        // Use the first flight offer for pricing
        const flightOffers = [flightSearchResult.data[0]];
        
        const { result, responseTime } = await this.measureResponseTime(() =>
          this.amadeusService.getFlightPricing(flightOffers)
        );
        
        this.logResult({
          api: 'Flight Pricing',
          success: result.success,
          data: result.data,
          responseTime
        });
      } else {
        this.logResult({
          api: 'Flight Pricing',
          success: false,
          error: 'No flight offers available for pricing test'
        });
      }
    } catch (error) {
      this.logResult({
        api: 'Flight Pricing',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Hotel Pricing (requires hotel offers from search)
    try {
      const mockHotelOffers = [
        {
          id: '1',
          pricingOptions: { fareType: 'PUBLISHED' },
          hotel: { name: 'Test Hotel' }
        }
      ];

      const { result, responseTime } = await this.measureResponseTime(() =>
        this.amadeusService.getHotelPricing(mockHotelOffers)
      );
      
      this.logResult({
        api: 'Hotel Pricing',
        success: true,
        data: result,
        responseTime
      });
    } catch (error) {
      this.logResult({
        api: 'Hotel Pricing',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Amadeus API Tests...');
    console.log('=====================================');
    
    const startTime = Date.now();
    
    await this.testFlightAPIs();
    
    // Add delay to avoid rate limiting
    console.log('\n⏳ Waiting 2 seconds to avoid rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.testHotelAPIs();
    
    // Add delay to avoid rate limiting
    console.log('\n⏳ Waiting 2 seconds to avoid rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.testReferenceDataAPIs();
    
    // Add delay to avoid rate limiting
    console.log('\n⏳ Waiting 2 seconds to avoid rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.testPricingAPIs();
    
    const totalTime = Date.now() - startTime;
    
    this.printSummary(totalTime);
  }

  private printSummary(totalTime: number) {
    console.log('\n📊 Test Summary');
    console.log('=====================================');
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.api}: ${r.error}`));
    }
    
    const successRate = ((successful / total) * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);
  }
}

// Run the tests
async function main() {
  try {
    const tester = new AmadeusAPITester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
main();
