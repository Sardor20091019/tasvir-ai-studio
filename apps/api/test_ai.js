require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('./node_modules/@google/genai');
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
console.log('Testing Gemini API key:', key ? key.slice(0, 8) + '...' : 'NONE');
const ai = new GoogleGenAI({ apiKey: key });

async function main() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with valid JSON: {"test": "ok"}',
      config: { responseMimeType: 'application/json' }
    });
    console.log('Gemini Success! Text:', res.text);
  } catch (err) {
    console.error('Gemini Failed:', err.message);
  }
}

main();
