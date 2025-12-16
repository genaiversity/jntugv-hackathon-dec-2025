const Event = require("../models/Event");
const User = require("../models/User");
const duplicateChecker = require("../ai/duplicateCheck");
const eventClassifier = require("../ai/classifyEvent");
const eventModerator = require("../ai/moderateEvent");
const eventSummarizer = require("../ai/summarizeEvent");

// Flag to track if MongoDB is available
let isDatabaseAvailable = true;

// Function to get static events when database is unavailable
function getStaticEvents() {
  return [
    {
      _id: "1",
      title: "Tech Conference 2025",
      description:
        "Annual technology conference featuring the latest innovations and networking opportunities.",
      location: "Convention Center, Downtown",
      locationCoords: {
        coordinates: [-0.1278, 51.5074], // [longitude, latitude]
      },
      date: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      category: "Technology",
      attendees: [],
      organizer: {
        _id: "org1",
        name: "Tech Org",
        email: "tech@example.com",
      },
    },
    {
      _id: "2",
      title: "Music Festival",
      description:
        "Three-day music festival with local and international artists.",
      location: "Central Park",
      locationCoords: {
        coordinates: [-0.1195, 51.5034], // [longitude, latitude]
      },
      date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 259200000).toISOString(), // In 3 days
      category: "Music",
      attendees: [],
      organizer: {
        _id: "org2",
        name: "Music Events Co.",
        email: "music@example.com",
      },
    },
    {
      _id: "3",
      title: "Art Workshop",
      description:
        "Hands-on workshop for beginners to learn watercolor painting techniques.",
      location: "Community Arts Center",
      locationCoords: {
        coordinates: [-0.1278, 51.5136], // [longitude, latitude]
      },
      date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
      category: "Workshop",
      attendees: [],
      organizer: {
        _id: "org3",
        name: "Art Academy",
        email: "art@example.com",
      },
    },
  ];
}

exports.getEvents = async (req, res) => {
  try {
    console.log("=== EVENTS CONTROLLER ===");
    let {
      latitude,
      longitude,
      radius = 10,
      category,
      startDate,
      endDate,
    } = req.query;

    console.log("Request query parameters:", {
      latitude,
      longitude,
      radius,
      category,
      startDate,
      endDate,
    });

    console.log("Fetching events from database with params:", {
      latitude,
      longitude,
      radius,
      category,
    });

    // Always fetch from database - no static fallback
    // Build query for approved events only
    let query = { status: "approved" };

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category;
    }

    // Add date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Add geospatial query if coordinates provided
    if (latitude && longitude) {
      console.log(
        "Adding geospatial query for coordinates:",
        latitude,
        longitude
      );
      query.locationCoords = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
        },
      };
    } else {
      console.log("No coordinates provided, fetching all approved events");
    }

    // Execute query
    console.log("Executing database query:", JSON.stringify(query, null, 2));
    const events = await Event.find(query)
      .populate("organizer", "name email")
      .sort({ date: 1 })
      .limit(100); // Limit to prevent overload

    console.log("Found", events.length, "events in database");

    // Transform events for frontend
    const transformedEvents = events.map((event) => ({
      _id: event._id || null,
      title: event.title || "Untitled Event",
      description: event.description || "No description available",
      location: event.location || "Location not specified",
      latitude:
        event.locationCoords && event.locationCoords.coordinates
          ? event.locationCoords.coordinates[1]
          : 0,
      longitude:
        event.locationCoords && event.locationCoords.coordinates
          ? event.locationCoords.coordinates[0]
          : 0,
      date: event.date || new Date(),
      endDate: event.endDate || new Date(),
      category: event.category || "uncategorized",
      attendees: event.attendees ? event.attendees.length : 0,
      organizer: event.organizer
        ? {
            id: event.organizer._id,
            name: event.organizer.name,
          }
        : {
            id: null,
            name: "Unknown Organizer",
          },
    }));

    console.log("Returning", transformedEvents.length, "transformed events");
    res.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    console.error("Error stack:", error.stack);

    // Return error instead of static events
    res.status(500).json({
      message: "Failed to fetch events from database",
      error: error.message,
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("attendees", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "approved") {
      return res.status(404).json({ message: "Event not found" });
    }

    // Transform event for frontend
    const transformedEvent = {
      _id: event._id,
      title: event.title,
      description: event.description,
      location: event.location,
      latitude: event.locationCoords.coordinates[1],
      longitude: event.locationCoords.coordinates[0],
      date: event.date,
      endDate: event.endDate,
      category: event.category,
      attendees: event.attendees.map((attendee) => ({
        id: attendee._id,
        name: attendee.name,
      })),
      organizer: {
        id: event.organizer._id,
        name: event.organizer.name,
        email: event.organizer.email,
      },
      photos: event.photos || [], // Include photos in response
      createdAt: event.createdAt,
    };

    res.json(transformedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createEvent = async (req, res) => {
  try {
    // When using FormData with multer, fields are in req.body
    // Log the received data for debugging
    console.log("Received body:", req.body);
    console.log("Received files:", req.files);

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      date,
      endDate,
      category,
    } = req.body;

    // Log individual fields for debugging
    console.log("Fields:", {
      title,
      description,
      location,
      latitude,
      longitude,
      date,
      endDate,
      category,
    });

    // Validate required fields
    if (
      !title ||
      !description ||
      !location ||
      !latitude ||
      !longitude ||
      !date
    ) {
      console.log("Missing required fields:", {
        title: !!title,
        description: !!description,
        location: !!location,
        latitude: !!latitude,
        longitude: !!longitude,
        date: !!date,
      });
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Additional validation for latitude and longitude
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
      console.log("Invalid latitude or longitude values:", {
        latitude,
        longitude,
      });
      return res
        .status(400)
        .json({ message: "Latitude and longitude must be valid numbers" });
    }

    // Validate latitude and longitude ranges
    if (parsedLatitude < -90 || parsedLatitude > 90) {
      console.log("Latitude out of range:", parsedLatitude);
      return res
        .status(400)
        .json({ message: "Latitude must be between -90 and 90" });
    }

    if (parsedLongitude < -180 || parsedLongitude > 180) {
      return res
        .status(400)
        .json({ message: "Longitude must be between -180 and 180" });
    }

    // Additional check for valid coordinate values
    if (!isFinite(parsedLatitude) || !isFinite(parsedLongitude)) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude must be finite numbers" });
    }

    // Check if user is organizer or admin
    if (req.user.role !== "organizer" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to create events" });
    }

    // Run AI moderation
    const moderationResult = await eventModerator.moderateEvent(
      title,
      description
    );

    // Run AI classification if category not provided
    let eventCategory = category;
    if (!eventCategory) {
      eventCategory = await eventClassifier.classifyEvent(title, description);
    }

    // Run AI summarization
    const summaryResult = await eventSummarizer.summarizeEvent(
      title,
      description
    );

    // Run duplicate check
    const allEvents = await Event.find({});
    const duplicates = await duplicateChecker.checkForDuplicates(
      { title, description, latitude, longitude, date },
      allEvents
    );

    // Auto-reject if high-risk duplicate found
    let status = "approved";
    let duplicateRisk = 0;

    if (duplicates.length > 0) {
      const highestSimilarity = Math.max(
        ...duplicates.map((d) => d.similarityScore)
      );
      duplicateRisk = highestSimilarity;

      // Auto-reject if very high similarity
      if (highestSimilarity > 0.9) {
        status = "rejected";
      }
    }

    // Auto-reject if high risk score from moderation
    if (moderationResult.isFlagged && moderationResult.riskScore > 0.7) {
      status = "rejected";
    }

    // Extract photo paths from uploaded files
    const photoPaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    // Create event
    const event = new Event({
      title,
      description,
      location,
      locationCoords: {
        type: "Point",
        coordinates: [parsedLongitude, parsedLatitude],
      },
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      category: eventCategory,
      organizer: req.user._id,
      status,
      photos: photoPaths, // Save photo paths
      aiFlags: {
        duplicateRisk,
        moderationWarnings: moderationResult.warnings.map((w) => w.message),
        riskScore: moderationResult.riskScore,
        summary: summaryResult.summary,
        highlights: summaryResult.highlights,
        tags: summaryResult.tags,
      },
    });

    const savedEvent = await event.save();

    // Populate organizer info
    await savedEvent.populate("organizer", "name email");

    console.log(
      `Event created and saved to database: ${savedEvent._id} (${savedEvent.title})`
    );

    res.status(201).json({
      message: "Event created successfully",
      event: {
        _id: savedEvent._id,
        title: savedEvent.title,
        description: savedEvent.description,
        location: savedEvent.location,
        latitude: savedEvent.locationCoords.coordinates[1],
        longitude: savedEvent.locationCoords.coordinates[0],
        date: savedEvent.date,
        endDate: savedEvent.endDate,
        category: savedEvent.category,
        status: savedEvent.status,
        photos: savedEvent.photos || [], // Include photos in response
        organizer: {
          id: savedEvent.organizer._id,
          name: savedEvent.organizer.name,
        },
        aiSummary: {
          shortTitle: summaryResult.shortTitle,
          summary: summaryResult.summary,
          highlights: summaryResult.highlights,
          tags: summaryResult.tags,
        },
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      latitude,
      longitude,
      date,
      endDate,
      category,
      status,
    } = req.body;

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is organizer of this event or admin
    if (
      req.user.role !== "admin" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = location;
    if (latitude && longitude) {
      // Validate latitude and longitude
      const parsedLatitude = parseFloat(latitude);
      const parsedLongitude = parseFloat(longitude);

      if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude must be valid numbers" });
      }

      // Validate latitude and longitude ranges
      if (parsedLatitude < -90 || parsedLatitude > 90) {
        return res
          .status(400)
          .json({ message: "Latitude must be between -90 and 90" });
      }

      if (parsedLongitude < -180 || parsedLongitude > 180) {
        return res
          .status(400)
          .json({ message: "Longitude must be between -180 and 180" });
      }

      // Additional check for valid coordinate values
      if (!isFinite(parsedLatitude) || !isFinite(parsedLongitude)) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude must be finite numbers" });
      }

      event.locationCoords = {
        type: "Point",
        coordinates: [parsedLongitude, parsedLatitude],
      };
    }
    if (date) event.date = new Date(date);
    if (endDate) event.endDate = new Date(endDate);
    if (category) event.category = category;

    // Only admins can update status
    if (status && req.user.role === "admin") {
      event.status = status;
    }

    const updatedEvent = await event.save();

    // Populate organizer info
    await updatedEvent.populate("organizer", "name email");

    res.json({
      message: "Event updated successfully",
      event: {
        _id: updatedEvent._id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        latitude: updatedEvent.locationCoords.coordinates[1],
        longitude: updatedEvent.locationCoords.coordinates[0],
        date: updatedEvent.date,
        endDate: updatedEvent.endDate,
        category: updatedEvent.category,
        status: updatedEvent.status,
        organizer: {
          id: updatedEvent.organizer._id,
          name: updatedEvent.organizer.name,
        },
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is organizer of this event or admin
    if (
      req.user.role !== "admin" &&
      event.organizer.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    await event.remove();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Attend/leave event
exports.attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Cannot attend unapproved event" });
    }

    // Check if user is already attending
    const isAttending = event.attendees.includes(req.user._id);

    if (isAttending) {
      // Remove user from attendees
      event.attendees = event.attendees.filter(
        (attendee) => attendee.toString() !== req.user._id.toString()
      );
    } else {
      // Add user to attendees
      event.attendees.push(req.user._id);
    }

    await event.save();

    res.json({
      message: isAttending
        ? "Left event successfully"
        : "Joined event successfully",
      attendees: event.attendees.length,
    });
  } catch (error) {
    console.error("Error attending event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get events organized by user
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate("attendees", "name email")
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    console.error("Error fetching my events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get events user is attending
exports.getAttendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      attendees: req.user._id,
      status: "approved",
    })
      .populate("organizer", "name email")
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error("Error fetching attending events:", error);
    res.status(500).json({ message: "Server error" });
  }
};
