require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testApiKey() {
  try {
    console.log("Testing Gemini API key...");
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log(
      "GEMINI_API_KEY length:",
      process.env.GEMINI_API_KEY?.length || 0
    );

    if (!process.env.GEMINI_API_KEY) {
      console.log("No API key found");
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try to get any model
    console.log("Trying to initialize model...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Model initialized successfully");

    // Try a simple text generation
    console.log("Testing simple text generation...");
    const result = await model.generateContent("Hello, world!");
    const response = await result.response;
    const text = response.text();
    console.log("Generated text:", text.substring(0, 100) + "...");
  } catch (error) {
    console.error("Error testing API key:", error.message);
    console.error("Error details:", error);
  }
}

testApiKey();
