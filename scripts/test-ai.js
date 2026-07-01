// Test Gemini AI
require('dotenv').config({ path: '.env.local' });

const { GoogleGenAI } = require('@google/genai');

async function testAI() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Gemini API key check:', process.env.GEMINI_API_KEY.substring(0, 20) + '...');

    // Try to get a specific model
    const model = ai.models.getModel('models/gemini-2.5-flash');
    console.log('Model:', model.name);

    // Test simple generation
    const result = await model.generateContent('Hello, how are you?');
    console.log('Response:', result.text);
    console.log('✅ Gemini AI is working!');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
}

testAI();
