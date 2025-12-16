const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Event = require("../models/Event");
const User = require("../models/User");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/eventmap");

// Sample user data
const sampleUser = {
  name: "Demo User",
  email: "demo@example.com",
  password: "password123",
  role: "organizer",
};

// Sample events data
const sampleEvents = [
  {
    title: "Tech Conference 2023",
    description:
      "Annual technology conference featuring keynote speakers and workshops on the latest trends in software development, AI, and cloud computing.",
    location: "Convention Center",
    locationCoords: {
      type: "Point",
      coordinates: [-74.006, 40.7128], // [longitude, latitude]
    },
    date: new Date("2023-12-15T10:00:00Z"),
    endDate: new Date("2023-12-15T17:00:00Z"),
    category: "Technology",
    status: "approved",
  },
  {
    title: "Jazz Night Live",
    description:
      "Live jazz performance by local musicians. Enjoy smooth jazz classics in an intimate setting with great acoustics.",
    location: "City Park Amphitheater",
    locationCoords: {
      type: "Point",
      coordinates: [-74.001, 40.7218],
    },
    date: new Date("2023-12-16T19:00:00Z"),
    endDate: new Date("2023-12-16T22:00:00Z"),
    category: "Music",
    status: "approved",
  },
  {
    title: "Art Exhibition Opening",
    description:
      "Opening night of contemporary art exhibition showcasing emerging artists from the region. Wine and cheese reception included.",
    location: "Downtown Gallery",
    locationCoords: {
      type: "Point",
      coordinates: [-74.009, 40.7188],
    },
    date: new Date("2023-12-17T18:00:00Z"),
    endDate: new Date("2023-12-17T21:00:00Z"),
    category: "Arts",
    status: "approved",
  },
  {
    title: "Charity Marathon",
    description:
      "Annual charity marathon to support local causes. Runners of all levels welcome. Registration includes t-shirt and refreshments.",
    location: "Riverside Park",
    locationCoords: {
      type: "Point",
      coordinates: [-74.013, 40.7058],
    },
    date: new Date("2023-12-18T08:00:00Z"),
    endDate: new Date("2023-12-18T14:00:00Z"),
    category: "Sports",
    status: "approved",
  },
];

// Seed function
const seedEvents = async () => {
  try {
    // Clear existing events and users
    await Event.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing events and users");

    // Create a sample user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sampleUser.password, salt);

    const user = new User({
      name: sampleUser.name,
      email: sampleUser.email,
      password: hashedPassword,
      role: sampleUser.role,
    });

    const savedUser = await user.save();
    console.log("Sample user created:", savedUser.email);

    // Add organizer to each event
    const eventsWithOrganizer = sampleEvents.map((event) => ({
      ...event,
      organizer: savedUser._id,
    }));

    // Insert sample events
    await Event.insertMany(eventsWithOrganizer);
    console.log("Sample events seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding events:", error);
    process.exit(1);
  }
};

// Run seed function
seedEvents();
