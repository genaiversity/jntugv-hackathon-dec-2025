const express = require("express");
const router = express.Router();
const eventController = require("../controllers/events");
const { protect, organizerOrAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEventById);

// Protected routes
router.post(
  "/",
  protect,
  organizerOrAdmin,
  upload.array("photos", 5),
  eventController.createEvent
);
router.put("/:id", protect, organizerOrAdmin, eventController.updateEvent);
router.delete("/:id", protect, organizerOrAdmin, eventController.deleteEvent);
router.post("/:id/attend", protect, eventController.attendEvent);

// Organizer routes
router.get(
  "/my/events",
  protect,
  organizerOrAdmin,
  eventController.getMyEvents
);

// User routes
router.get("/attending", protect, eventController.getAttendingEvents);

module.exports = router;
