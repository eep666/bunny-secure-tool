Secure Bunny.net Chapter Tool

This is a Next.js project that provides a secure, server-side tool for updating Bunny.net video chapters.

All API keys are stored securely on the server and are never exposed to the user's browser.

How to Deploy (using Vercel)

Create a GitHub Repository: Create a new repository on GitHub and upload all the files from this project into it.

Import to Vercel: Go to your Vercel dashboard, click "Add New... > Project", and import the repository you just created.

Add Environment Variables: This is the most important step. In your Vercel project's settings, go to Settings > Environment Variables.

Add one variable with the name BUNNY_API_KEY and paste your Bunny.net Stream API key as the value.

Add a second variable with the name GEMINI_API_KEY and paste your Google AI Studio API key as the value.

Deploy: Click the "Deploy" button. Vercel will build the project.

Once deployed, you will have a secure, professional-grade tool.