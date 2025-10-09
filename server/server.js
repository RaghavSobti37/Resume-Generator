require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fetch = require('node-fetch');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const MODEL_NAME = 'gemini-pro-latest';

async function callGeminiAPI(prompt, systemPrompt, responseSchema) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please check your .env file.');
    }
    const apiUrl = `${API_BASE_URL}${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            maxOutputTokens: 8192,
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
        throw new Error('Invalid API response structure from Gemini.');
    }
    return JSON.parse(jsonText);
}

const parseResume = async (resumeText) => {
    if (!resumeText) throw new Error("Resume text is empty.");

    const systemPrompt = `You are an expert resume parser. Your task is to analyze the provided resume text and extract key information into a structured JSON object.

You must extract the following fields:
- name: The full name of the person.
- title: The professional title or headline (e.g., "Senior Software Engineer").
- email: The email address.
- phone: The phone number.
- linkedin: The LinkedIn profile URL or username.
- github: The GitHub username (not the full URL).
- summary: The professional summary section.
- experience: An array of jobs. Each job should be an object with 'title', 'organization', 'dates', and 'description'.
- education: An array of educational items. Each item should be an object with 'title' (degree), 'organization' (institution), and 'dates'.

Return a single, clean JSON object adhering to the provided schema. Do not include any fields that are not found in the resume.`;

    const userPrompt = `
Resume Text:
---
${resumeText}
---

Parse the resume text and return the data in the specified JSON format. For example:
{
  "name": "Jane Doe",
  "title": "Full Stack Developer",
  "email": "jane.doe@email.com",
  "phone": "(123) 456-7890",
  "linkedin": "linkedin.com/in/janedoe",
  "github": "janedoe-dev",
  "summary": "Innovative Full Stack Developer with 5+ years of experience in building and maintaining responsive web applications. Proficient in React, Node.js, and Python. Seeking to leverage technical expertise to build robust solutions.",
  "experience": [
    {
      "title": "Senior Software Engineer",
      "organization": "Innovate Inc.",
      "dates": "Jan 2021 - Present",
      "description": "- Led the development of a new e-commerce platform, resulting in a 30% increase in sales.\n- Mentored junior developers and conducted code reviews to ensure code quality."
    },
    {
      "title": "Software Developer",
      "organization": "Solutions Co.",
      "dates": "Jun 2018 - Dec 2020",
      "description": "- Developed and shipped 10+ features for a client-facing web application using Angular and Java.\n- Optimized application performance, reducing load times by 20%."
    }
  ],
  "education": [
    {
      "title": "Master of Science in Computer Science",
      "organization": "State University",
      "dates": "2016 - 2018"
    },
    {
      "title": "Bachelor of Science in Information Technology",
      "organization": "Tech College",
      "dates": "2012 - 2016"
    }
  ]
}
`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            "name": { "type": "STRING" },
            "title": { "type": "STRING" },
            "email": { "type": "STRING" },
            "phone": { "type": "STRING" },
            "linkedin": { "type": "STRING" },
            "github": { "type": "STRING" },
            "summary": { "type": "STRING" },
            "experience": { type: "ARRAY", items: { type: "OBJECT", properties: { "title": { "type": "STRING" }, "organization": { "type": "STRING" }, "dates": { "type": "STRING" }, "description": { "type": "STRING" } } } },
            "education": { type: "ARRAY", items: { type: "OBJECT", properties: { "title": { "type": "STRING" }, "organization": { "type": "STRING" }, "dates": { "type": "STRING" } } } }
        }
    };

    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};

app.post('/api/parse', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdf(req.file.buffer);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        // For debugging: send the extracted text back to the client
        res.send(text);

        // const parsedData = await parseResume(text);
        // res.json(parsedData);
    } catch (error) {
        console.error('Error parsing resume:', error);
        res.status(500).json({ error: `Error parsing resume: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
