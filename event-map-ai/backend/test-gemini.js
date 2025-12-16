/**
 * Test script for Gemini API
 * Run this to verify your API key is working
 */

require('dotenv').config();
const axios = require('axios');

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_actual_gemini_api_key_here') {
    console.log('❌ Please set your GEMINI_API_KEY in the .env file');
    return;
  }

  console.log('🧪 Testing Gemini API...');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: "Hello! Can you help me test this API connection?"
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini API is working!');
    console.log('📝 Response:', result);
    
  } catch (error) {
    console.log('❌ Gemini API test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testGeminiAPI();