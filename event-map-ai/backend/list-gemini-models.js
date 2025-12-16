/**
 * List available Gemini models
 */

require('dotenv').config();
const axios = require('axios');

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Please set your GEMINI_API_KEY in the .env file');
    return;
  }

  console.log('🔍 Listing available Gemini models...');
  
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    console.log('✅ Available models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
    
  } catch (error) {
    console.log('❌ Failed to list models:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

listGeminiModels();