import { profileSummary, projectDescription, projectHighlights, rankProjects } from './localResume';
import { profileFromResumeText } from './resumeParser';

export const fetchGitHubData = async (username) => {
  if (!username?.trim()) throw new Error('GitHub username is required.');
  const profileResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`);
  if (!profileResponse.ok) throw new Error(profileResponse.status === 404 ? 'GitHub user not found.' : 'Could not fetch GitHub profile.');
  const profileData = await profileResponse.json();
  const repositoriesResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?per_page=100&sort=updated`);
  if (!repositoriesResponse.ok) throw new Error('Could not fetch GitHub projects.');
  const repositories = await repositoriesResponse.json();
  return {
    profile: { name: profileData.name || username, summary: profileData.bio || '', github: username },
    repos: repositories.filter((repo) => !repo.fork).map((repo) => ({
      id: String(repo.id),
      name: repo.name,
      description: repo.description || 'No description provided.',
      tech_stack: [repo.language, ...(repo.topics || [])].filter(Boolean),
      repo_url: repo.html_url.replace('https://', ''),
    })),
  };
};

export const getReadmeContent = async (githubUsername, repoName) => {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(githubUsername)}/${encodeURIComponent(repoName)}/readme`);
  if (response.status === 404) return 'No README file found for this repository.';
  if (!response.ok) throw new Error(`Could not fetch README for ${repoName}.`);
  const data = await response.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\s/g, '')), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const matchProjectsWithJD = async (jobDescription, projects) => {
  const ids = new Set(rankProjects(projects, jobDescription));
  return projects.filter((project) => ids.has(project.id)).map((project) => ({
    ...project,
    justification: `Selected because its stack and delivery focus match terms in this role.`,
  }));
};

export const getKeywordsFromJD = async (jobDescription) => [...new Set(String(jobDescription || '').match(/[A-Za-z][A-Za-z0-9+#.]{1,}/g) || [])].slice(0, 15);

export const generateProjectHighlights = async (project) => projectHighlights(project);

export const generateSummary = async (userData, projects) => profileSummary(userData, projects);

export const generateTailoredContent = async (userData, projects, jobDescription) => {
  const ids = new Set(rankProjects(projects, jobDescription));
  const matchedProjects = projects.filter((project) => ids.has(project.id));
  return {
    summary: profileSummary(userData, matchedProjects),
    relevantSkills: [...new Set(matchedProjects.flatMap((project) => project.tech_stack || []))].slice(0, 15),
    matchedProjects: matchedProjects.map((project) => ({ id: project.id, highlights: projectHighlights(project) })),
  };
};

export const matchProjects = async (projects, jobDescription) => ({ matchedProjectIds: rankProjects(projects, jobDescription) });

export const generateProjectDescription = async (project) => projectDescription(project);

export const refineText = async (text, style) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (style === 'brevity') return normalized.replace(/\b(very|really|just|basically|actually)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  return normalized;
};

export const parseResume = async (file) => {
  if (!file) throw new Error('Choose a PDF or DOCX resume first.');
  const fileName = String(file.name || '').toLowerCase();
  let text = '';

  if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items.map((item) => item.str || '').join(' ');
    }));
    text = pages.join('\n');
  } else {
    throw new Error('Only PDF and DOCX resumes are supported.');
  }

  if (!text.trim()) throw new Error('No selectable text was found in this resume. Use a text-based PDF or DOCX file.');
  return { ...profileFromResumeText(text), rawText: text };
};
