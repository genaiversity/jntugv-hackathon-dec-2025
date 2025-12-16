require("dotenv").config();
const multimodalService = require("./src/ai/multimodalService");

console.log("Testing multimodal service...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

// Test with a simple image file (if exists)
const fs = require("fs");
const path = require("path");

// Check if we have any images in the uploads folder
const uploadsDir = path.join(__dirname, "uploads");
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  const imageFiles = files.filter(
    (file) =>
      file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")
  );

  console.log("Found image files:", imageFiles);

  if (imageFiles.length > 0) {
    const imagePath = path.join(uploadsDir, imageFiles[0]);
    console.log("Testing analysis on:", imagePath);

    multimodalService
      .analyzeImage(imagePath)
      .then((result) => {
        console.log("Analysis result:", JSON.stringify(result, null, 2));
      })
      .catch((error) => {
        console.error("Analysis error:", error);
      });
  } else {
    console.log("No image files found in uploads directory");
  }
} else {
  console.log("Uploads directory does not exist");
}
