import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const apiKey = process.env.GEMINI_API_KEY;
const model = "gemini-2.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "You are a validator. Return JSON: { \"valid\": true } and nothing else."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    })
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Response body:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Fetch error:', err);
}
