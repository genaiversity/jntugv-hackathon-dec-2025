const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

class MultimodalService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    if (this.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
        // Try to initialize with a working model
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        this.apiAvailable = true;
      } catch (error) {
        console.warn("Failed to initialize Gemini API:", error.message);
        this.apiAvailable = false;
      }
    } else {
      console.warn(
        "GEMINI_API_KEY not configured - multimodal features will be limited"
      );
      this.apiAvailable = false;
    }
  }

  /**
   * Analyze an image and extract relevant information
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Analysis results including description, objects, and tags
   */
  async analyzeImage(imagePath) {
    try {
      if (!this.apiAvailable || !this.geminiApiKey) {
        return this.getFallbackAnalysis(imagePath);
      }

      // Read the image file
      const imageData = fs.readFileSync(imagePath);

      // Convert to base64
      const base64Image = imageData.toString("base64");

      // Create the prompt for image analysis
      const prompt = `
        Analyze this image and provide:
        1. A detailed description of what's in the image
        2. A list of objects, people, or notable elements visible
        3. Tags or categories that best describe the image content
        4. Any text visible in the image
        5. The overall scene or setting
        6. Suggested event title based on the image content
        7. Suggested event category
        8. Suggested event location type (indoor/outdoor/public/private)
        9. Suggested date/time if evident from the image
        
        Format your response as JSON with these keys:
        {
          "description": "detailed description",
          "objects": ["object1", "object2"],
          "tags": ["tag1", "tag2"],
          "visibleText": "any text in image",
          "scene": "overall scene description",
          "suggestedTitle": "Suggested event title",
          "suggestedCategory": "Suggested category",
          "suggestedLocationType": "indoor/outdoor/etc",
          "suggestedDateTime": "suggested date/time if visible"
        }
      `;

      // Generate content with image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: this.getMimeType(imagePath),
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if JSON not found
          return {
            description: text,
            objects: [],
            tags: [],
            visibleText: "",
            scene: "Image analysis completed",
            suggestedTitle: "Event from Image",
            suggestedCategory: "general",
            suggestedLocationType: "varies",
            suggestedDateTime: new Date().toISOString(),
          };
        }
      } catch (parseError) {
        // If parsing fails, return a structured response
        return {
          description: text,
          objects: [],
          tags: [],
          visibleText: "",
          scene: "Image analysis completed",
          suggestedTitle: "Event from Image",
          suggestedCategory: "general",
          suggestedLocationType: "varies",
          suggestedDateTime: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      return this.getFallbackAnalysis(imagePath);
    }
  }

  /**
   * Generate event suggestions based on an image
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Event suggestions based on image content
   */
  async suggestEventsFromImage(imagePath) {
    try {
      if (!this.apiAvailable || !this.geminiApiKey) {
        return this.getFallbackEventSuggestions(imagePath);
      }

      // Read the image file
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      // Create the prompt for event suggestions
      const prompt = `
        Based on this image, suggest relevant events that someone might want to organize or attend.
        Consider the content, setting, people, and activities shown in the image.
        
        Provide 3-5 event suggestions with:
        1. Event title
        2. Brief description
        3. Suggested category
        4. Potential location type
        5. Target audience
        
        Format your response as JSON array:
        [
          {
            "title": "Event Title",
            "description": "Brief description",
            "category": "event category",
            "locationType": "indoor/outdoor/etc",
            "targetAudience": "who would be interested"
          }
        ]
      `;

      // Generate content with image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: this.getMimeType(imagePath),
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Try to parse the JSON response
      try {
        // Extract JSON array from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if JSON not found
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing event suggestions:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error suggesting events from image:", error);
      return this.getFallbackEventSuggestions(imagePath);
    }
  }

  /**
   * Extract text from an image (OCR)
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromImage(imagePath) {
    try {
      if (!this.apiAvailable || !this.geminiApiKey) {
        return "Image text extraction requires Gemini API key";
      }

      // Read the image file
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      // Create the prompt for OCR
      const prompt =
        "Extract all text visible in this image. Return only the text content.";

      // Generate content with image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: this.getMimeType(imagePath),
          },
        },
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error extracting text from image:", error);
      return "Failed to extract text from image";
    }
  }

  /**
   * Get MIME type based on file extension
   * @param {string} filePath - Path to the file
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return mimeTypes[ext] || "image/jpeg";
  }

  /**
   * Fallback analysis when Gemini API is not available
   * @param {string} imagePath - Path to the image file
   * @returns {Object} Fallback analysis results
   */
  getFallbackAnalysis(imagePath) {
    // Try to infer some basic information from the image file itself
    const fileName = path.basename(imagePath);
    const ext = path.extname(fileName).toLowerCase();

    // Simple heuristic based on file extension
    let category = "general";
    let scene = "Generic image";

    if (ext.includes("photo") || ext.includes("pic")) {
      category = "photography";
      scene = "Photograph";
    } else if (ext.includes("screen") || ext.includes("capture")) {
      category = "technology";
      scene = "Screenshot";
    }

    return {
      description: `Image analysis requires Gemini API key for full functionality. This appears to be a ${scene} file.`,
      objects: ["image"],
      tags: ["photo", category],
      visibleText: "No text extracted",
      scene: scene,
      suggestedTitle: `${scene} Event`,
      suggestedCategory: category,
      suggestedLocationType: "varies",
      suggestedDateTime: new Date().toISOString(),
    };
  }

  /**
   * Fallback event suggestions when Gemini API is not available
   * @param {string} imagePath - Path to the image file
   * @returns {Array} Fallback event suggestions
   */
  getFallbackEventSuggestions(imagePath) {
    return [
      {
        title: "Image-Based Event",
        description: "An event suggested based on your uploaded image",
        category: "general",
        locationType: "varies",
        targetAudience: "general public",
      },
      {
        title: "Photo Sharing Event",
        description: "Share and discuss interesting photos with others",
        category: "social",
        locationType: "indoor",
        targetAudience: "photography enthusiasts",
      },
      {
        title: "Digital Art Showcase",
        description: "Display and celebrate digital artwork",
        category: "arts",
        locationType: "online",
        targetAudience: "artists and designers",
      },
    ];
  }
}

module.exports = new MultimodalService();
