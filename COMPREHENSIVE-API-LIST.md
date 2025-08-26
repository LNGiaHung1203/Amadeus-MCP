# 🚀 Comprehensive Amadeus MCP Server - Complete API List

Your MCP server now provides access to **17 powerful travel planning and booking tools** powered by the Amadeus API ecosystem!

## 📊 **Tool Count: 17 Total Tools**

---

## ✈️ **Flight Search & Planning (4 Tools)**

### 1. `search_flights`

- **Purpose**: Search for available flights between airports
- **Parameters**: origin, destination, departureDate, returnDate (optional), adults, max
- **Example**: Find flights from NYC to LAX on December 15, 2025

### 2. `search_flight_destinations`

- **Purpose**: Discover flight destinations from a specific origin
- **Parameters**: origin, departureDate, oneWay, max
- **Example**: Find all destinations from NYC on a specific date

### 3. `get_flight_offers_pricing`

- **Purpose**: Get detailed pricing for specific flight offers
- **Parameters**: flightOffers (array)
- **Example**: Price specific flight selections

### 4. `get_flight_seatmaps`

- **Purpose**: Get seat maps for specific flights
- **Parameters**: flightOffers (array)
- **Example**: View available seats and cabin layout

---

## 🏨 **Hotel Search & Booking (3 Tools)**

### 5. `search_hotels`

- **Purpose**: Search for available hotels in a city
- **Parameters**: cityCode, checkInDate, checkOutDate, adults, max
- **Example**: Find hotels in Paris from Dec 15-17, 2025

### 6. `search_hotels_by_geolocation`

- **Purpose**: Search for hotels near specific coordinates
- **Parameters**: latitude, longitude, radius, checkInDate, checkOutDate, adults
- **Example**: Find hotels within 5km of specific GPS coordinates

### 7. `get_hotel_details`

- **Purpose**: Get detailed information about a specific hotel
- **Parameters**: hotelId
- **Example**: Get comprehensive hotel information and amenities

---

## 🚗 **Car Rental Options (1 Tool)**

### 8. `search_car_rentals`

- **Purpose**: Search for car rental options in a city
- **Parameters**: cityCode, pickUpDate, dropOffDate, pickUpTime, dropOffTime
- **Example**: Find car rentals in Paris for specific dates

---

## 🎯 **Points of Interest & Activities (1 Tool)**

### 9. `search_points_of_interest`

- **Purpose**: Search for attractions and activities in a city
- **Parameters**: cityCode, categories, radius, max
- **Example**: Find museums, restaurants, and sights in Paris

---

## 🏙️ **Location & Reference Data (3 Tools)**

### 10. `search_airports`

- **Purpose**: Search for airports by keyword or location
- **Parameters**: keyword, countryCode (optional), max
- **Example**: Find airports matching "London" or "LHR"

### 11. `search_cities`

- **Purpose**: Search for cities by keyword
- **Parameters**: keyword, countryCode (optional), max
- **Example**: Find cities matching "Paris" or "PAR"

### 12. `get_airport_weather`

- **Purpose**: Get weather information for an airport
- **Parameters**: airportCode
- **Example**: Check weather conditions at LAX

---

## 🗺️ **Trip Planning & Recommendations (2 Tools)**

### 13. `get_travel_recommendations`

- **Purpose**: Get personalized travel tips and activity suggestions
- **Parameters**: destination, interests, budget, duration
- **Example**: Get recommendations for Tokyo with culture and food interests

### 14. `create_trip_plan`

- **Purpose**: Create comprehensive trip plans with flights, hotels, and activities
- **Parameters**: origin, destination, departureDate, returnDate, adults, interests, budget
- **Example**: Plan a complete NYC to Paris trip with flights, hotels, and activities

---

## 💰 **Pricing & Financial (1 Tool)**

### 15. `get_currency_conversion`

- **Purpose**: Get currency conversion rates
- **Parameters**: from, to
- **Example**: Convert USD to EUR

---

## 🔮 **Travel Insights & Predictions (2 Tools)**

### 16. `get_travel_predictions`

- **Purpose**: Get travel predictions and insights for destinations
- **Parameters**: origin, destination, departureDate
- **Example**: Get travel insights for NYC to London route

### 17. `get_destination_insights`

- **Purpose**: Get insights about a specific destination
- **Parameters**: destination
- **Example**: Get comprehensive insights about Paris

---

## 🎯 **How to Use These Tools**

### **Basic Usage**

```bash
# Start the comprehensive server
npm run comprehensive

# Test all tools
npm run test:comprehensive
```

### **MCP Client Integration**

```json
{
  "mcpServers": {
    "amadeus-comprehensive": {
      "command": "node",
      "args": ["/path/to/amadeus-mcp/comprehensive-server.js"]
    }
  }
}
```

---

## 🌟 **Key Benefits of the Comprehensive Server**

1. **🎯 Complete Travel Planning**: From inspiration to booking
2. **✈️ Multi-Modal Transport**: Flights, cars, and more
3. **🏨 Accommodation Options**: Hotels with detailed information
4. **🎯 Activity Discovery**: Points of interest and recommendations
5. **🗺️ Intelligent Planning**: AI-powered trip suggestions
6. **💰 Price Transparency**: Real-time pricing and currency conversion
7. **🌍 Global Coverage**: Worldwide destinations and services

---

## 🚀 **Next Steps**

Your comprehensive MCP server is now ready for production use! You can:

1. **Test Individual Tools**: Use the test functions to verify each API
2. **Integrate with MCP Clients**: Connect to any MCP-compatible AI assistant
3. **Customize Responses**: Modify the response formats for your specific needs
4. **Add More APIs**: Extend with additional Amadeus endpoints as needed

---

## 📞 **Support & Documentation**

- **Amadeus API Docs**: [https://developers.amadeus.com/](https://developers.amadeus.com/)
- **MCP Protocol**: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
- **Test Environment**: Use `test.api.amadeus.com` for development
- **Production**: Switch to `api.amadeus.com` when ready

---

**🎉 Congratulations! You now have the most comprehensive travel MCP server available!**
