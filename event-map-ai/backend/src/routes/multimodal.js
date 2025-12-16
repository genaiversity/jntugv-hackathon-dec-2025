const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const multimodalService = require("../ai/multimodalService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "temp-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Analyze an uploaded image
router.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      req.file.filename
    );

    // Analyze the image
    const analysis = await multimodalService.analyzeImage(imagePath);

    // Extract text from image
    const extractedText = await multimodalService.extractTextFromImage(
      imagePath
    );

    // Get event suggestions
    const eventSuggestions = await multimodalService.suggestEventsFromImage(
      imagePath
    );

    // Clean up temporary file
    // Note: In production, you might want to keep this file or handle it differently
    // const fs = require('fs');
    // fs.unlinkSync(imagePath);

    res.json({
      success: true,
      analysis: analysis,
      extractedText: extractedText,
      eventSuggestions: eventSuggestions,
      fileName: req.file.filename,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res
      .status(500)
      .json({ error: "Failed to analyze image", details: error.message });
  }
});

// Extract text from an uploaded image (OCR)
router.post("/extract-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      req.file.filename
    );

    // Extract text from image
    const extractedText = await multimodalService.extractTextFromImage(
      imagePath
    );

    res.json({
      success: true,
      extractedText: extractedText,
      fileName: req.file.filename,
    });
  } catch (error) {
    console.error("Error extracting text:", error);
    res
      .status(500)
      .json({ error: "Failed to extract text", details: error.message });
  }
});

// Get event suggestions from an uploaded image
router.post("/suggest-events", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imagePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      req.file.filename
    );

    // Get event suggestions
    const eventSuggestions = await multimodalService.suggestEventsFromImage(
      imagePath
    );

    res.json({
      success: true,
      eventSuggestions: eventSuggestions,
      fileName: req.file.filename,
    });
  } catch (error) {
    console.error("Error suggesting events:", error);
    res
      .status(500)
      .json({ error: "Failed to suggest events", details: error.message });
  }
});

module.exports = router;
