const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  locationCoords: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
      required: true,
    },
  },
  date: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  category: {
    type: String,
    required: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  aiFlags: {
    duplicateRisk: {
      type: Number,
      default: 0,
    },
    moderationWarnings: [
      {
        type: String,
      },
    ],
    riskScore: {
      type: Number,
      default: 0,
    },
  },
  // Added field for storing photo paths
  photos: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create geospatial index
eventSchema.index({ locationCoords: "2dsphere" });

module.exports = mongoose.model("Event", eventSchema);
