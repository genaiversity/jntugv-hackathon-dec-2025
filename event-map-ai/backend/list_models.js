require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // List all available models
    const models = await genAI.listModels();

    console.log("Available models:");
    models.models.forEach((model) => {
      console.log(`- ${model.name}: ${model.displayName || "No display name"}`);
      if (model.description) {
        console.log(`  Description: ${model.description}`);
      }
    });
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
