// Test Gemini AI (ES Module)
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAI() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Gemini API key check:', process.env.GEMINI_API_KEY.substring(0, 20) + '...');

    // List available models
    const models = await ai.models.list();
    const firstModel = models[0];
    console.log('Using model:', firstModel.name);

    // Test simple generation
    const result = await firstModel.generateContent('Hello, how are you?');
    console.log('Response:', result.text);
    console.log('✅ Gemini AI is working!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
}

testAI();
