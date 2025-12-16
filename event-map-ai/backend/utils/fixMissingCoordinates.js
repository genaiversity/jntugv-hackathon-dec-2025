const mongoose = require("mongoose");
require("dotenv").config();

// Import the Event model
const Event = require("../src/models/Event");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("Connected to MongoDB");

    // Find all events that are missing locationCoords or have invalid locationCoords
    const events = await Event.find({
      $or: [
        { locationCoords: { $exists: false } },
        { "locationCoords.coordinates": { $exists: false } },
        { "locationCoords.coordinates": { $size: 0 } },
        { "locationCoords.type": { $ne: "Point" } },
      ],
    });

    console.log(
      `Found ${events.length} events with missing or invalid locationCoords`
    );

    // Fix each event
    for (const event of events) {
      console.log(`Fixing event: ${event.title} (${event._id})`);

      // Set default coordinates to [0, 0] if missing
      // In a real scenario, you might want to geocode the location string
      event.locationCoords = {
        type: "Point",
        coordinates: [0, 0], // [longitude, latitude]
      };

      try {
        await event.save();
        console.log(`Successfully fixed event: ${event.title} (${event._id})`);
      } catch (error) {
        console.error(`Error fixing event ${event._id}:`, error);
      }
    }

    console.log("Finished fixing events with missing locationCoords");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });
