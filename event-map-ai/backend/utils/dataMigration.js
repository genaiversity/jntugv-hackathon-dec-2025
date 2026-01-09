const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Event = require("../src/models/Event");
const User = require("../src/models/User");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("Connected to MongoDB");

    // Run all migration fixes
    await fixMissingCoordinates();
    await fixInvalidDates();
    await ensureDefaultCategories();

    console.log("All data migrations completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });

// Fix events with missing or invalid locationCoords
async function fixMissingCoordinates() {
  console.log("Checking for events with missing location coordinates...");

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

  for (const event of events) {
    console.log(`Fixing coordinates for event: ${event.title} (${event._id})`);

    // Set default coordinates to [0, 0] if missing
    event.locationCoords = {
      type: "Point",
      coordinates: [0, 0], // [longitude, latitude]
    };

    try {
      await event.save();
      console.log(`Successfully fixed coordinates for event: ${event._id}`);
    } catch (error) {
      console.error(`Error fixing coordinates for event ${event._id}:`, error);
    }
  }
}

// Fix events with invalid dates
async function fixInvalidDates() {
  console.log("Checking for events with invalid dates...");

  const events = await Event.find({
    $or: [
      { date: { $exists: false } },
      { date: { $type: "string" } }, // Dates stored as strings
      { date: { $eq: null } },
    ],
  });

  console.log(`Found ${events.length} events with invalid dates`);

  for (const event of events) {
    console.log(`Fixing dates for event: ${event.title} (${event._id})`);

    // Try to parse string dates or set to current date if invalid
    try {
      if (typeof event.date === "string") {
        const parsedDate = new Date(event.date);
        if (isNaN(parsedDate.getTime())) {
          event.date = new Date(); // Set to current date if parsing fails
        } else {
          event.date = parsedDate;
        }
      } else if (!event.date) {
        event.date = new Date(); // Set to current date if null/undefined
      }

      await event.save();
      console.log(`Successfully fixed dates for event: ${event._id}`);
    } catch (error) {
      console.error(`Error fixing dates for event ${event._id}:`, error);
    }
  }
}

// Ensure all events have a valid category
async function ensureDefaultCategories() {
  console.log("Checking for events with missing categories...");

  const events = await Event.find({
    $or: [
      { category: { $exists: false } },
      { category: { $eq: null } },
      { category: { $eq: "" } },
    ],
  });

  console.log(`Found ${events.length} events with missing categories`);

  const defaultCategories = [
    "other",
    "music",
    "sports",
    "workshop",
    "exhibition",
    "college fest",
    "religious",
    "promotion",
  ];

  for (const event of events) {
    console.log(`Fixing category for event: ${event.title} (${event._id})`);

    // Set to "other" if category is missing
    event.category = "other";

    try {
      await event.save();
      console.log(`Successfully fixed category for event: ${event._id}`);
    } catch (error) {
      console.error(`Error fixing category for event ${event._id}:`, error);
    }
  }
}
