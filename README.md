# AI Resume Generator

## Overview
The AI Resume Generator is a web application built with React that helps users create professional resumes. It uses the Gemini API to analyze a user's GitHub projects and a job description to generate tailored, impactful bullet points for their resume.

## Features
- Multi-step resume builder interface
- Fetches public repositories from a user's GitHub profile.
- AI-powered project highlight generation based on a job description.
- Live, in-browser editing of the final resume preview.
- PDF export functionality for resumes
- Data persistence using browser's Local Storage.
- Responsive design for mobile and desktop.

## Prerequisites
- Node.js (14+ recommended)
- npm

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RaghavSobti37/Resume-Generator.git
   cd Resume-Generator/client
   ```

2. **Install dependencies**

   This will install all the necessary packages for the React application.
   ```bash
   npm install
   ```

3. **Set up Environment Variables**

   The application requires an API key from Google to power its AI features.
   
   - In the `client` directory, create a new file named `.env`.
   - Open the `.env` file and add the following line, replacing `YOUR_GEMINI_API_KEY` with your actual key.

   ```env
   # client/.env
   REACT_APP_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
   > You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open the app in your browser** at http://localhost:3000.

## Build & Serve (Production)
- Create production build:
  npm run build
- Serve locally (optional):
  npm install -g serve
  serve -s build
- App will be available at the URL shown by serve (usually http://localhost:3000)

## Environment / Security Notes
- Do not commit real secrets to source control. Use environment management for production deployments.
- The Gemini API is called directly from the client in this project. For a production application, it is strongly recommended to route these calls through a secure backend proxy to protect your API key.

## Contributing
Contributions welcome. Open issues or submit PRs.