const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
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
            responseSchema: responseSchema
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

export const matchProjectsWithJD = async (jobDescription, projects) => {
    if (!jobDescription || projects.length === 0) return [];

    const projectListString = projects.map(p =>
        `[${p.id}] ${p.name}: ${p.description} (Tech Stack: ${p.tech_stack.join(', ')})`
    ).join('\n');

    const systemPrompt = "You are a Resume Project Matching AI. Your task is to analyze the Job Description (JD) and the provided list of user projects. Select the top 3 projects that are most relevant to the JD. For each selected project, provide a concise, tailored justification (max 2 sentences) explaining *why* it is a perfect match. Return the result as a strict JSON array.";
    const userPrompt = `JOB DESCRIPTION:\n---\n${jobDescription}\n---\n\nAVAILABLE PROJECTS:\n---\n${projectListString}\n---\n\nSelect the top 3 most relevant projects and provide the justification.`;

    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "id": { "type": "STRING" },
                "name": { "type": "STRING" },
                "justification": { "type": "STRING" }
            },
            required: ["id", "name", "justification"]
        }
    };

    const matchedResults = await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
    return matchedResults.map(match => {
        const originalProject = projects.find(p => p.id === match.id);
        return originalProject ? { ...originalProject, justification: match.justification } : null;
    }).filter(p => p !== null);
};

export const getKeywordsFromJD = async (jobDescription) => {
    if (!jobDescription) return [];

    const systemPrompt = "You are an expert resume keyword analyzer. Analyze the provided Job Description (JD) and extract the top 10-15 most important technical skills, soft skills, and qualifications. Return these as a simple JSON array of strings.";
    const userPrompt = `JOB DESCRIPTION:\n---\n${jobDescription}\n---\n\nExtract the top 10-15 keywords and return them as a JSON array of strings.`;

    const responseSchema = { type: "ARRAY", items: { type: "STRING" } };
    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};

export const fetchGitHubData = async (username) => {
    if (!username) throw new Error("GitHub username is required.");

    const profileRes = await fetch(`https://api.github.com/users/${username}`);
    if (!profileRes.ok) throw new Error(`GitHub user not found: ${username}`);
    const profileData = await profileRes.json();

    const reposRes = await fetch(profileData.repos_url);
    if (!reposRes.ok) throw new Error(`Could not fetch repos for ${username}`);
    const reposData = await reposRes.json();

    const profile = {
        name: profileData.name || username,
        summary: profileData.bio || '',
        github: username,
    };

    const repos = reposData
        // .filter(repo => !repo.fork) // Temporarily allow forks to see all projects
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .map(repo => ({
            id: repo.id.toString(),
            name: repo.name,
            description: repo.description || 'No description provided.',
            tech_stack: [repo.language, ...repo.topics].filter(Boolean),
            repo_url: repo.html_url.replace('https://', ''),
        }));

    return { profile, repos };
};

export const getReadmeContent = async (githubUsername, repoName) => {
    const response = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/readme`);
    if (!response.ok) {
        if (response.status === 404) {
            return "No README file found for this repository.";
        }
        throw new Error(`Could not fetch README for ${repoName}`);
    }
    const data = await response.json();
    // The content is base64 encoded, so we need to decode it.
    return atob(data.content);
};

export const generateProjectHighlights = async (project, readmeContent, jobDescription) => {
    if (!jobDescription) {
        throw new Error("Job Description is required to generate highlights.");
    }

    const systemPrompt = `You are an expert resume writer. Your task is to generate 2-3 crisp, concise, and impactful bullet points for a resume project section. The bullet points must highlight the project's accomplishments and technologies, tailored specifically to the provided job description. Start each bullet point with a strong action verb. Be direct and to the point.`;

    const userPrompt = `
Job Description:
---
${jobDescription}
---

Project Name: ${project.name}
Project Description: ${project.description}
Project README Content:
---
${readmeContent}
---

Based on all the provided information, generate 2-3 resume bullet points that make this project sound as relevant as possible for the job. Return the result as a JSON array of strings.`;

    const responseSchema = { type: "ARRAY", items: { type: "STRING" } };
    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};
