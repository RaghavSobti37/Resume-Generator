const STOP_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'from', 'in', 'of', 'or', 'the', 'to', 'with']);

function terms(value = '') {
  return new Set(String(value).toLowerCase().split(/[^a-z0-9+#.]+/).flatMap((term) => {
    const compact = term.replace('.', '');
    return [term, compact].filter((item) => item.length > 1 && !STOP_WORDS.has(item));
  }));
}

export function rankProjects(projects, jobDescription) {
  const jobTerms = terms(jobDescription);
  return projects
    .map((project, index) => {
      const projectTerms = terms([project.name, project.description, ...(project.tech_stack || [])].join(' '));
      const score = [...projectTerms].filter((term) => jobTerms.has(term)).length;
      return { id: project.id, index, score };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map((project) => project.id);
}

export function projectDescription(project) {
  const tech = (project.tech_stack || []).filter(Boolean).slice(0, 3).join(', ');
  return tech ? `${project.name} — built with ${tech}.` : `${project.name} — a software project delivered from concept to working product.`;
}

export function projectHighlights(project) {
  const tech = (project.tech_stack || []).filter(Boolean).slice(0, 3).join(', ');
  return [
    `Built ${project.name} to ${project.description || 'solve a practical user problem'}.`,
    tech ? `Applied ${tech} to deliver a focused, usable product.` : 'Delivered a focused, usable product from concept to release.',
  ];
}

export function profileSummary(userData, projects) {
  const title = userData.title || 'Software professional';
  const skills = (userData.allTechStack || []).filter(Boolean).slice(0, 6).join(', ');
  const projectNames = projects.slice(0, 3).map((project) => project.name).join(', ');
  return `${title} with hands-on experience building ${projectNames || 'user-focused software products'}${skills ? ` using ${skills}` : ''}.`;
}
