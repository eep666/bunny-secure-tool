// --- Helper function to parse the SIMPLE chapter text ---
// This is duplicated from the frontend, but it's good practice
// to validate/parse on the server.
const parseChapters = (chaptersText) => {
    const lines = chaptersText.split('\n').filter(line => line.trim() !== '');
    const chapters = lines.map(line => {
        const parts = line.split(',');
        if (parts.length < 3) {
            throw new Error(`Invalid line: "${line}". Format must be: start_seconds, end_seconds, title`);
        }
        
        const start = parseInt(parts[0].trim(), 10);
        const end = parseInt(parts[1].trim(), 10);
        const title = parts.slice(2).join(',').trim(); 

        if (isNaN(start) || isNaN(end)) {
            throw new Error(`Invalid timestamps in line: "${line}".`);
        }

        return { title, start, end };
    });
    return { chapters }; // Return in the format the API expects
};


// --- Main API Handler ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Get the SECURE API Key from Environment Variables
    const BUNNY_API_KEY = process.env.BUNNY_API_KEY;

    if (!BUNNY_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: BUNNY_API_KEY is not set.' });
    }

    // 2. Get data from the frontend
    const { libraryId, videoId, chaptersText, mode } = req.body;

    if (!libraryId || !videoId || !chaptersText || !mode) {
        return res.status(400).json({ error: 'Missing required fields: libraryId, videoId, chaptersText, mode' });
    }

    let requestBody;
    try {
        if (mode === 'simple') {
            requestBody = parseChapters(chaptersText);
        } else {
            requestBody = JSON.parse(chaptersText);
            if (!requestBody.chapters) {
                throw new Error('Invalid JSON. Must be an object with a "chapters" key.');
            }
        }
    } catch (error) {
        return res.status(400).json({ error: `Input Error: ${error.message}` });
    }

    // 3. Construct the API endpoint
    const apiUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

    // 4. Make the secure API call from the server
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'AccessKey': BUNNY_API_KEY // The SECRET key
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${errorData.message || 'Unknown error'}`);
        }

        const successData = await response.json();
        return res.status(200).json(successData);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

