// --- Gemini API Helper (Exponential Backoff) ---
async function exponentialBackoffFetch(url, options, retries = 5, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return exponentialBackoffFetch(url, options, retries - 1, delay * 2);
            }
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return exponentialBackoffFetch(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}


// --- Main API Handler ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Get the SECURE API Key from Environment Variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is not set.' });
    }

    // 2. Get raw text from the frontend
    const { rawText } = req.body;
    if (!rawText) {
        return res.status(400).json({ error: 'Missing required field: rawText' });
    }
    
    // 3. Define the schema and prompt for Gemini
    const responseSchema = {
        type: "OBJECT",
        properties: {
            chapters: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        start: { type: "NUMBER" },
                        end: { type: "NUMBER" }
                    },
                    required: ["title", "start", "end"]
                }
            }
        },
        required: ["chapters"]
    };

    const systemPrompt = `You are an expert video chaptering assistant. The user will provide a raw list of chapters and timestamps. Your ONLY job is to convert this text into a valid JSON object matching the provided schema.

- 'start' is the start time in seconds.
- 'end' is the end time in seconds.
- Timestamps like '1:30' must be converted to seconds (90).
- Be smart about inferring the 'end' time. The 'end' time for one chapter is usually the 'start' time of the *next* chapter.
- For the very last chapter, you may have to estimate the 'end' time if it's not provided, or set it to a reasonable duration after the start.`;

    const apiUrl = `https://generativelace.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: rawText }]
        }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    };

    // 4. Make the secure API call from the server
    try {
        const result = await exponentialBackoffFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const part = result?.candidates?.[0]?.content?.parts?.[0];
        if (part && part.text) {
            // Success! Send the JSON data back to the frontend.
            const jsonData = JSON.parse(part.text);
            return res.status(200).json(jsonData);
        } else {
            throw new Error('Invalid AI response structure.');
        }

    } catch (error) {
        return res.status(500).json({ error: `AI Generation Failed: ${error.message}` });
    }
}

