const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Event = require("../src/models/Event");
const User = require("../src/models/User");

async function retrieveEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap"
    );
    console.log("Connected to MongoDB");

    // Retrieve all events
    const events = await Event.find({}).populate("organizer", "name");

    console.log(`Found ${events.length} events:`);
    events.forEach((event) => {
      console.log(`
Title: ${event.title}
Description: ${event.description}
Location: ${event.location}
Coordinates: [${event.locationCoords.coordinates[0]}, ${
        event.locationCoords.coordinates[1]
      }]
Date: ${event.date}
Category: ${event.category}
Status: ${event.status}
Organizer: ${event.organizer ? event.organizer.name : "Unknown"}
      `);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");

    return events;
  } catch (error) {
    console.error("Error retrieving events:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  retrieveEvents();
}

module.exports = retrieveEvents;
