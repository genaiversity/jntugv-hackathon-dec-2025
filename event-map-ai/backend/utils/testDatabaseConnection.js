const mongoose = require("mongoose");
require("dotenv").config();

// Import the Event model
const Event = require("../src/models/Event");

console.log("Testing database connection...");
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully");
    
    try {
      // Test query - fetch all events
      console.log("Fetching all events...");
      const events = await Event.find({}).limit(10);
      console.log(`✅ Found ${events.length} events in the database`);
      
      // Show details of first few events
      events.slice(0, 3).forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`  ID: ${event._id}`);
        console.log(`  Title: ${event.title}`);
        console.log(`  Status: ${event.status}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Coordinates: [${event.locationCoords.coordinates[0]}, ${event.locationCoords.coordinates[1]}]`);
      });
      
      // Test geospatial query for events near (18, 83)
      console.log("\n🔍 Testing geospatial query for events near (18.15, 83.37)...");
      const nearbyEvents = await Event.find({
        status: "approved",
        locationCoords: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [83.37, 18.15],
            },
            $maxDistance: 100000, // 100km in meters
          },
        },
      }).limit(10);
      
      console.log(`✅ Found ${nearbyEvents.length} events near (18.15, 83.37)`);
      
      nearbyEvents.forEach((event, index) => {
        const distance = calculateDistance(
          18.15, 83.37,
          event.locationCoords.coordinates[1], 
          event.locationCoords.coordinates[0]
        );
        console.log(`  ${index + 1}. ${event.title} (${distance.toFixed(2)} km away)`);
      });
      
    } catch (error) {
      console.error("❌ Error querying events:", error);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log("\n🔒 MongoDB connection closed");
    }
  })
  .catch((error) => {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  });

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}