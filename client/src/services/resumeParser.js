const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s|,]+/i;
const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,]+/i;

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function firstUsefulLine(lines) {
  return lines.find((line) => {
    const value = clean(line);
    return value.length > 2 && value.length < 80 && !EMAIL_PATTERN.test(value) && !PHONE_PATTERN.test(value) && !/linkedin|github/i.test(value);
  }) || '';
}

/**
 * Produces a conservative draft from extracted resume text. It deliberately
 * leaves uncertain fields blank so people can review rather than overwrite
 * their profile with invented information.
 */
export function profileFromResumeText(text) {
  const rawText = String(text || '').replace(/\r/g, '');
  const lines = rawText.split('\n').map(clean).filter(Boolean);
  const name = firstUsefulLine(lines);
  const nameIndex = lines.indexOf(name);
  const possibleTitle = nameIndex >= 0 ? lines.slice(nameIndex + 1).find((line) => line.length < 100 && !EMAIL_PATTERN.test(line) && !PHONE_PATTERN.test(line) && !/linkedin|github|experience|education/i.test(line)) : '';

  const email = rawText.match(EMAIL_PATTERN)?.[0] || '';
  const phone = clean(rawText.match(PHONE_PATTERN)?.[0] || '');
  const linkedin = rawText.match(LINKEDIN_PATTERN)?.[0] || '';
  const github = rawText.match(GITHUB_PATTERN)?.[0]?.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '').replace(/\/$/, '') || '';
  const summaryStart = lines.findIndex((line) => /^(summary|profile|about|professional summary)$/i.test(line));
  const summary = summaryStart >= 0 ? clean(lines.slice(summaryStart + 1, summaryStart + 5).join(' ')).slice(0, 800) : '';

  return { name, title: possibleTitle || '', email, phone, linkedin, github, summary };
}
