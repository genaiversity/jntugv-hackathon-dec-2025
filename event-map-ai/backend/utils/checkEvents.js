const mongoose = require("mongoose");
require("dotenv").config();

// Import the Event model
const Event = require("../src/models/Event");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Fetch all events
      const events = await Event.find({});
      console.log(`Found ${events.length} events in the database:`);

      events.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`  ID: ${event._id}`);
        console.log(`  Title: ${event.title}`);
        console.log(`  Status: ${event.status}`);
        console.log(`  Category: ${event.category}`);
        console.log(`  Location: ${event.location}`);
        console.log(
          `  Coordinates: [${event.locationCoords.coordinates[0]}, ${event.locationCoords.coordinates[1]}]`
        );
        console.log(`  Date: ${event.date}`);
      });

      // Count events by status
      const statusCounts = {};
      events.forEach((event) => {
        statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
      });

      console.log("\nEvent counts by status:");
      Object.keys(statusCounts).forEach((status) => {
        console.log(`  ${status}: ${statusCounts[status]}`);
      });
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });
