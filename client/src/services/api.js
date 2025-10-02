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
            responseSchema: responseSchema,
            maxOutputTokens: 8192, // Increase token limit to prevent truncated JSON
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

export const generateSummary = async (userData, projects, jobDescription) => {
    if (!jobDescription) throw new Error("Job Description is required.");

    const systemPrompt = `You are an expert resume writer. Based on the user's profile, their projects, and the job description, write a compelling 2-3 sentence professional summary. The summary should be tailored to the job description.`;

    const userPrompt = `
**JOB DESCRIPTION:**
---
${jobDescription}
---

**USER PROFILE & PROJECTS:**
---
Full Skill List: ${(userData.allTechStack || []).join(', ')}
Experience: ${(userData.experience || []).map(e => `${e.title} at ${e.organization}`).join(', ')}
Projects: ${projects.map(p => `${p.name}: ${p.description}`).join('\n')}
---

Generate the professional summary as a single string.`;

    const responseSchema = { type: "OBJECT", properties: { "summary": { "type": "STRING" } } };
    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};

export const generateTailoredContent = async (userData, projects, jobDescription) => {
    if (!jobDescription) throw new Error("Job Description is required.");

    const systemPrompt = `You are an expert resume writer and career coach. Your task is to analyze the user's profile, their list of projects, and a target job description to generate a perfectly tailored resume content package.

You must perform the following actions and return them in a single, structured JSON object:
1.  **Professional Summary**: Write a 2-3 sentence professional summary that highlights the user's most relevant skills and experience for this specific job.
2.  **Relevant Skills**: From the user's full list of skills, select the top 10-15 most relevant ones for the job description.
3.  **Matched Projects**: Select the top 3 most relevant projects. For each of these projects, you MUST generate 2-3 crisp, concise, and impactful bullet-point highlights that align the project's achievements with the job requirements. Start each highlight with a strong action verb.

Return a single JSON object adhering to the provided schema.`;

    const userPrompt = `
**JOB DESCRIPTION:**
---
${jobDescription}
---

**USER PROFILE:**
---
Name: ${userData.name}
Title: ${userData.title}
Existing Summary: ${userData.summary}
Full Skill List: ${(userData.allTechStack || []).join(', ')}
Experience: ${(userData.experience || []).map(e => `${e.title} at ${e.organization}`).join(', ')}
---

**AVAILABLE PROJECTS:**
---
${projects.map(p => `[${p.id}] ${p.name}: ${p.description} (Tech: ${p.tech_stack.join(', ')})`).join('\n')}
---

Generate the tailored resume content package.`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            "summary": { "type": "STRING" },
            "relevantSkills": { "type": "ARRAY", "items": { "type": "STRING" } },
            "matchedProjects": {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "id": { "type": "STRING" },
                        "highlights": { "type": "ARRAY", "items": { "type": "STRING" } }
                    },
                    required: ["id", "highlights"]
                }
            }
        }
    };

    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};

export const matchProjects = async (projects, jobDescription) => {
    if (!jobDescription) throw new Error("Job Description is required.");

    const systemPrompt = `You are a technical recruiter AI. Your task is to analyze a job description and a list of projects.

You must perform the following actions:
1.  Identify the key technologies and programming languages required by the job description.
2.  Compare these requirements against the tech stack of each project.
3.  Select the top 3 most relevant projects that best match the job's technical requirements.

Return a single JSON object containing a list of the IDs of the matched projects.`;

    const userPrompt = `
**JOB DESCRIPTION:**
---
${jobDescription}
---

**AVAILABLE PROJECTS:**
---
${projects.map(p => `[${p.id}] ${p.name} (Tech: ${p.tech_stack.join(', ')})`).join('\n')}
---

Return a JSON object with a single key "matchedProjectIds" which is an array of the top 3 project IDs.`;

    const responseSchema = { type: "OBJECT", properties: { "matchedProjectIds": { type: "ARRAY", "items": { "type": "STRING" } } } };
    return await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
};

export const generateProjectDescription = async (project, jobDescription) => {
    const systemPrompt = `You are an expert technical writer. Your task is to write a concise and professional one-sentence description for a software project. The description should summarize the project's purpose and key technology. If a job description is provided, tailor the project description to sound more relevant to the job.`;

    const userPrompt = `
Project Name: ${project.name}
Existing Description: ${project.description}
Tech Stack: ${project.tech_stack.join(', ')}
Job Description (for context, optional):
---
${jobDescription || 'N/A'}
---

Generate a new, improved one-sentence description for this project. Return a JSON object with a single key "description".`;

    const responseSchema = { type: "OBJECT", properties: { "description": { "type": "STRING" } } };
    const result = await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
    return result.description;
};

export const refineText = async (text, style, context) => {
    const systemPrompt = `You are an expert editor and technical writer. Your task is to refine the given text based on a specific style. The available styles are:
- 'impact': Enhances weak statements by incorporating strong action verbs and focusing the narrative on measurable results and project influence.
- 'target': Rephrases the selected text to strategically incorporate keywords from the provided job description context.
- 'brevity': Executes a conciseness pass, eliminating filler words and condensing phrases to maximize information density without losing technical detail.
- 'clarity': Standardizes complex or fragmented sentences, converts passive voice to active voice, and ensures smooth, logical flow between ideas.
- 'assurance': Refines the tone by removing any hesitant language and replacing it with terminology that conveys unwavering confidence and expertise.

You must only return the refined text. If the original text is a list of bullet points (separated by newlines), you MUST return a list of bullet points in the same format.`;

    const userPrompt = `
Original Text:
---
${text}
---

Refinement Style: ${style}

Additional Context (like a job description, for tailoring):
---
${context || 'N/A'}
---

Please refine the text according to the style. Return a JSON object with a single key "refinedText".`;

    const responseSchema = { type: "OBJECT", properties: { "refinedText": { "type": "STRING" } } };
    const result = await callGeminiAPI(userPrompt, systemPrompt, responseSchema);
    return result.refinedText;
};
