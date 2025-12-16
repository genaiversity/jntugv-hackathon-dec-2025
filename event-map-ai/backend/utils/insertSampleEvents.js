const mongoose = require("mongoose");
require("dotenv").config();

// Import the Event model
const Event = require("../src/models/Event");

// Sample events data
const sampleEvents = [
  {
    _id: "693d68e173004ed5c84cf449",
    title: "Tech Conference 2025",
    description:
      "Annual technology conference featuring the latest innovations",
    location: "asdfasdfadsf",
    locationCoords: {
      type: "Point",
      coordinates: [-0.1278, 51.5074],
    },
    date: new Date("2025-12-20T13:23:00.000Z"),
    endDate: new Date("2025-12-27T13:23:00.000Z"),
    category: "technology",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T13:23:45.400Z"),
  },
  {
    _id: "693d68e173004ed5c84cf450",
    title: "Jazz Night Live",
    description: "Live jazz performance with local musicians",
    location: "asdfasdfadsf",
    locationCoords: {
      type: "Point",
      coordinates: [-0.1275, 51.5071],
    },
    date: new Date("2025-12-20T13:23:00.000Z"),
    endDate: new Date("2025-12-27T13:23:00.000Z"),
    category: "music",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T13:25:12.100Z"),
  },
  {
    _id: "693d68e173004ed5c84cf451",
    title: "Basketball Tournament",
    description: "3-on-3 basketball tournament for all skill levels",
    location: "asdfasdfadsf",
    locationCoords: {
      type: "Point",
      coordinates: [-0.1281, 51.5077],
    },
    date: new Date("2025-12-20T13:23:00.000Z"),
    endDate: new Date("2025-12-27T13:23:00.000Z"),
    category: "sports",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T13:26:33.750Z"),
  },
  {
    _id: "693d68e173004ed5c84cf452",
    title: "Watercolor Workshop",
    description: "Learn watercolor painting techniques for beginners",
    location: "asdfasdfadsf",
    locationCoords: {
      type: "Point",
      coordinates: [-0.1272, 51.5068],
    },
    date: new Date("2025-12-20T13:23:00.000Z"),
    endDate: new Date("2025-12-27T13:23:00.000Z"),
    category: "workshop",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T13:27:45.200Z"),
  },
  {
    _id: "693d68e173004ed5c84cf453",
    title: "Art Exhibition",
    description: "Contemporary art exhibition featuring local artists",
    location: "asdfasdfadsf",
    locationCoords: {
      type: "Point",
      coordinates: [-0.1285, 51.5081],
    },
    date: new Date("2025-12-20T13:23:00.000Z"),
    endDate: new Date("2025-12-27T13:23:00.000Z"),
    category: "exhibition",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T13:28:55.600Z"),
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Insert sample events
      for (const event of sampleEvents) {
        // Check if event already exists
        const existingEvent = await Event.findById(event._id);
        if (existingEvent) {
          console.log(`Event ${event._id} already exists, skipping...`);
          continue;
        }

        // Create new event
        const newEvent = new Event(event);
        await newEvent.save();
        console.log(
          `Successfully inserted event: ${event.title} (${event._id})`
        );
      }

      console.log("All sample events inserted successfully!");
    } catch (error) {
      console.error("Error inserting sample events:", error);
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
