const mongoose = require("mongoose");
require("dotenv").config();

// Import the Event model
const Event = require("../src/models/Event");

// Base coordinates (18.151677, 83.373504) - near here only
const baseLat = 18.151677;
const baseLng = 83.373504;

// Function to generate random coordinates within ~10km radius
function getRandomNearbyCoordinates(lat, lng, radiusKm = 10) {
  // Convert radius to degrees (approximate)
  const radiusInDegrees = radiusKm / 111; // 1 degree ≈ 111 km

  // Generate random offset within radius
  const randomOffsetLat = (Math.random() - 0.5) * 2 * radiusInDegrees;
  const randomOffsetLng = (Math.random() - 0.5) * 2 * radiusInDegrees;

  return {
    latitude: lat + randomOffsetLat,
    longitude: lng + randomOffsetLng,
  };
}

// Sample events data near the specified coordinates
const localEvents = [
  {
    _id: "693d68e173004ed5c84cf501",
    title: "Classical Music Concert",
    description:
      "An evening of classical music featuring works by Bach, Mozart, and Beethoven performed by the local symphony orchestra.",
    location: "City Concert Hall",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-20T19:00:00.000Z"),
    endDate: new Date("2025-12-20T21:30:00.000Z"),
    category: "music",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:00:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf502",
    title: "Tech Startup Pitch Night",
    description:
      "Watch local entrepreneurs pitch their innovative ideas to investors. Network with fellow tech enthusiasts.",
    location: "Innovation Hub",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-21T18:30:00.000Z"),
    endDate: new Date("2025-12-21T21:00:00.000Z"),
    category: "technology",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:05:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf503",
    title: "Community Soccer Match",
    description:
      "Friendly soccer match between neighborhood teams. All skill levels welcome!",
    location: "Central Park Sports Field",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-22T16:00:00.000Z"),
    endDate: new Date("2025-12-22T18:00:00.000Z"),
    category: "sports",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:10:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf504",
    title: "Photography Workshop",
    description:
      "Learn the basics of photography including composition, lighting, and post-processing techniques.",
    location: "Art Center Studio",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-23T10:00:00.000Z"),
    endDate: new Date("2025-12-23T13:00:00.000Z"),
    category: "workshop",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:15:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf505",
    title: "Local Art Exhibition",
    description:
      "Showcasing works by emerging local artists. Featuring paintings, sculptures, and digital art.",
    location: "Downtown Gallery",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-24T11:00:00.000Z"),
    endDate: new Date("2025-12-24T19:00:00.000Z"),
    category: "exhibition",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:20:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf506",
    title: "University Cultural Fest",
    description:
      "Annual cultural fest celebrating diversity with food, performances, and activities from different cultures.",
    location: "University Campus",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-25T09:00:00.000Z"),
    endDate: new Date("2025-12-25T18:00:00.000Z"),
    category: "college fest",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:25:00.000Z"),
  },
  {
    _id: "693d68e173004ed5c84cf507",
    title: "Charity Gala Dinner",
    description:
      "Elegant evening fundraiser supporting local homeless shelters. Fine dining and entertainment provided.",
    location: "Grand Hotel Ballroom",
    locationCoords: {
      type: "Point",
      coordinates: [
        getRandomNearbyCoordinates(baseLat, baseLng).longitude,
        getRandomNearbyCoordinates(baseLat, baseLng).latitude,
      ],
    },
    date: new Date("2025-12-26T19:30:00.000Z"),
    endDate: new Date("2025-12-26T23:00:00.000Z"),
    category: "promotion",
    organizer: "693d68d073004ed5c84cf444",
    attendees: [],
    status: "approved",
    aiFlags: {},
    createdAt: new Date("2025-12-13T14:30:00.000Z"),
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Insert local events
      for (const event of localEvents) {
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

      console.log("All local events inserted successfully!");
    } catch (error) {
      console.error("Error inserting local events:", error);
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
