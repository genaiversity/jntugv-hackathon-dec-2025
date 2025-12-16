require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Testing Gemini API key...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);

if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini API initialized successfully");
  } catch (error) {
    console.error("Error initializing Gemini API:", error.message);
  }
} else {
  console.log("No GEMINI_API_KEY found");
}
