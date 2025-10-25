// --- Helper function to parse the SIMPLE chapter text ---
const parseChapters = (chaptersText) => {
    // Filter out empty lines
    const lines = chaptersText.split('\n').filter(line => line.trim() !== '');
    
    // Check if there are any lines to parse
    if (lines.length === 0) {
        throw new Error('No chapter data was provided.');
    }

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
        
        if (title.trim() === '') {
             throw new Error(`Missing title in line: "${line}".`);
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
    const { libraryId, videoId, chaptersText } = req.body;

    if (!libraryId || !videoId || !chaptersText) {
        return res.status(400).json({ error: 'Missing required fields: libraryId, videoId, chaptersText' });
    }

    let requestBody;
    try {
        // --- "SMART" LOGIC to detect format ---
        let potentialJson;
        try {
            // First, try to parse as JSON
            potentialJson = JSON.parse(chaptersText);
        } catch (e) {
            // It's not JSON, so we'll let the simple parser handle it
            potentialJson = null; 
        }

        // Check if it's valid JSON *and* has the .chapters key
        if (potentialJson && Array.isArray(potentialJson.chapters)) {
            // It's JSON format! Use it directly.
            requestBody = potentialJson;
        } else {
            // It's not valid chapter-JSON, so assume it's simple format.
            // This will throw an error if the simple format is *also* wrong.
            requestBody = parseChapters(chaptersText);
        }
        // --- END "SMART" LOGIC ---

    } catch (error) {
        // Catches errors from parseChapters() if it fails
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

