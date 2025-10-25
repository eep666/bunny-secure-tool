import { useState, useEffect } from 'react';
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

// --- NEW: Loading Skeleton Component ---
// This is a simple placeholder that looks like your app.
// It renders with the initial HTML, so there is no "blank page".
const LoadingSkeleton = () => (
    <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-lg p-6 md:p-8 animate-pulse">
        {/* Skeleton for Title */}
        <div className="h-7 bg-gray-700 rounded-md w-1/2 mx-auto mb-6"></div>
        
        {/* Skeleton for Credentials */}
        <div className="mb-6">
            <div className="h-5 bg-gray-700 rounded-md w-1/4 mb-3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-700 rounded-md"></div>
                <div className="h-10 bg-gray-700 rounded-md"></div>
            </div>
        </div>
        
        {/* Skeleton for Chapter Data */}
        <div className="mb-6">
            <div className="h-5 bg-gray-700 rounded-md w-1/4 mb-3"></div>
            <div className="h-36 bg-gray-700 rounded-md"></div>
        </div>
        
        {/* Skeleton for Button */}
        <div className="h-10 bg-gray-700 rounded-md w-full"></div>
    </div>
);


// --- NEW: Main App Content ---
// I've moved your entire tool into this component.
// It will only be shown *after* the page has loaded.
const AppContent = () => {
    // State for form inputs
    const [libraryId, setLibraryId] = useState('');
    const [videoId, setVideoId] = useState('');
    const [chaptersText, setChaptersText] = useState('');
    
    // State for loading and messages
    // THIS IS THE CORRECTED LINE:
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
                    chaptersText
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

    const simplePlaceholder = `Paste your chapter data here.
You can use Simple Format (one per line):
0, 59, Introduction
60, 299, Main Content

...or you can paste the full JSON:
{"chapters": [{"title": "Intro", "start": 0, "end": 59}]}
`;

    return (
        <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-lg p-6 md:p-8">
            <h1 className="text-2xl font-bold text-center text-white mb-6">
                Bunny.net Chapter Update Tool
            </h1>
            
            <form onSubmit={handleSubmit}>
                {/* --- Credentials Section --- */}
                <section className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Credentials</h2>
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
                
                {/* --- Chapter Input Section (Simplified) --- */}
                <section className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">Chapter Data</h2>
                    
                    <div className="mb-4">
                        <textarea
                            value={chaptersText}
                            onChange={e => setChaptersText(e.target.value)}
                            rows="10"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder={simplePlaceholder}
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">
                            You can paste Simple Format or the full JSON.
                        </p>
                    </div>
                </section>

                {/* --- Submit Button (Only one) --- */}
                <section>
                    <button
                        type="submit"
                        disabled={isLoading}
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
    );
};


// --- Main Page Component ---
export default function Home() {
    // This state tracks if the page is "hydrated" (JS is loaded)
    const [isMounted, setIsMounted] = useState(false);

    // After the component mounts (on the client), set isMounted to true
    useEffect(() => {
        setIsMounted(true);
    }, []); // Empty array means this runs only once after mount

    return (
        <>
            <Head>
                <title>Bunny.net Chapter Update Tool</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                {/* MOVED THIS LINE UP and removed 'defer' to fix the style flash */}
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            {/* We need to use Tailwind, so we add the CDN link in the Head */}
            
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
                /* NEW Skeleton Animation */
                @keyframes pulse {
                    50% {
                        opacity: .5;
                    }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
            
            <div className="flex flex-col items-center justify-start min-h-screen p-4 py-12 font-sans text-gray-200">
                {/* This is the magic:
                  - If the page is NOT mounted yet, show the Skeleton.
                  - As soon as the JS loads, show the real AppContent.
                */}
                {isMounted ? <AppContent /> : <LoadingSkeleton />}
            </div>
        </>
    );
}

