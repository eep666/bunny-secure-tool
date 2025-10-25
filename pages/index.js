import { useState } from 'react';
import Head from 'next/head';

// --- Reusable Input Component ---
const InputField = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

// --- Main App Component ---
export default function Home() {
    // State for form inputs
    // We NO LONGER store the apiKey in state.
    const [libraryId, setLibraryId] = useState('');
    const [videoId, setVideoId] = useState('');
    const [chaptersText, setChaptersText] = useState('');
    const [mode, setMode] = useState('simple'); // 'simple' or 'json'
    
    // State for AI Generator
    const [isAiLoading, setIsAiLoading] = useState(false);

    // State for loading and messages
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // --- AI Generator Logic ---
    const handleAiSubmit = async () => {
        if (chaptersText.trim() === '') {
            setMessage({ type: 'error', text: 'Please enter some raw chapter text first.' });
            return;
        }
        setIsAiLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Call our OWN backend API route
            const response = await fetch('/api/generateChapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText: chaptersText })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'AI generation failed.');
            }
            
            // Success! Format and set the state.
            const prettyJson = JSON.stringify(data, null, 2);
            setChaptersText(prettyJson); // Set main text area
            setMode('json'); // Switch to JSON mode
            setMessage({ type: 'success', text: 'AI generation successful! Review the JSON below and submit.' });

        } catch (error) {
            setMessage({ type: 'error', text: `AI Error: ${error.message}` });
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- Main Bunny.net Submit Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Call our OWN backend API route
            const response = await fetch('/api/updateChapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    libraryId,
                    videoId,
                    chaptersText,
                    mode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update chapters.');
            }

            setMessage({ type: 'success', text: 'Chapters updated successfully!' });
            setChaptersText(''); // Clear text area on success

        } catch (error) {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const simplePlaceholder = `Enter chapters, one per line. Format:
start_seconds, end_seconds, Chapter Title
0, 59, Introduction
60, 299, Main Content
300, 540, Conclusion`;

    const jsonPlaceholder = `Enter the full JSON payload, like in Postman.
Example:
{
  "chapters": [
    {
      "title": "Introduction",
      "start": 0,
      "end": 59
    },
    {
      "title": "Main Content",
      "start": 60,
      "end": 299
    }
  ]
}`;

    // --- Render the UI ---
    return (
        <>
            <Head>
                <title>Bunny.net Chapter Update Tool</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            {/* We need to use Tailwind, so we add the CDN link in the Head */}
            <script src="https://cdn.tailwindcss.com" defer></script>
            {/* Add global styles */}
            <style jsx global>{`
                body {
                    background-color: #111827; /* bg-gray-900 */
                }
                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top: 4px solid #fff;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .toggle-btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    border-radius: 0.375rem;
                }
                .toggle-btn-active {
                    background-color: #2563EB; /* bg-blue-600 */
                    color: white;
                }
                .toggle-btn-inactive {
                    background-color: #374151; /* bg-gray-700 */
                    color: #D1D5DB; /* text-gray-300 */
                }
                .toggle-btn-inactive:hover {
                    background-color: #4B5563; /* bg-gray-600 */
                }
            `}</style>
            
            <div className="flex flex-col items-center justify-start min-h-screen p-4 py-12 font-sans text-gray-200">
                <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-lg p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-center text-white mb-6">
                        Bunny.net Chapter Update Tool
                    </h1>
                    
                    {/* The API Key warning is no longer needed! */}

                    <form onSubmit={handleSubmit}>
                        {/* --- Credentials Section --- */}
                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Credentials</h2>
                            {/* API Key Input is REMOVED */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Video Library ID"
                                    value={libraryId}
                                    onChange={setLibraryId}
                                    placeholder="e.g., 123456"
                                />
                                <InputField
                                    label="Video GUID"
                                    value={videoId}
                                    onChange={setVideoId}
                                    placeholder="e.g., abc-123-def-456"
                                />
                            </div>
                        </section>
                        
                        {/* --- Chapter Input Section --- */}
                        <section className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Chapter Data</h2>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Input Mode</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setMode('simple')}
                                        className={`toggle-btn ${mode === 'simple' ? 'toggle-btn-active' : 'toggle-btn-inactive'}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('json')}
                                        className={`toggle-btn ${mode === 'json' ? 'toggle-btn-active' : 'toggle-btn-inactive'}`}
                                    >
                                        JSON (Advanced)
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {mode === 'simple' ? 'Chapters (Simple Format)' : 'JSON Body'}
                                </label>
                                <textarea
                                    value={chaptersText}
                                    onChange={e => setChaptersText(e.target.value)}
                                    rows="10"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder={mode === 'simple' ? simplePlaceholder : jsonPlaceholder}
                                ></textarea>
                                {mode === 'simple' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Format: <strong>start_seconds, end_seconds, Title</strong>
                                    </p>
                                )}
                            </div>

                            {/* --- AI Generator Button --- */}
                            <div className="mb-6">
                                <button
                                    type="button" // Prevent form submission
                                    onClick={handleAiSubmit}
                                    disabled={isAiLoading}
                                    className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-600"
                                >
                                    {isAiLoading ? <div className="spinner"></div> : 'Generate JSON from Text Above'}
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Paste raw text (e.g., "1:30 Intro") above, then click here to convert.
                                </p>
                            </div>
                        </section>

                        {/* --- Submit Button --- */}
                        <section>
                            <button
                                type="submit"
                                disabled={isLoading || isAiLoading}
                                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-600"
                            >
                                {isLoading ? <div className="spinner"></div> : 'Add/Update Chapters'}
                            </button>
                        </section>
                    </form>

                    {/* --- Message Area --- */}
                    {message.text && (
                        <div className={`mt-6 p-3 rounded-md text-sm ${
                            message.type === 'success' ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'
                        }`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

