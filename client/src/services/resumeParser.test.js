import { profileFromResumeText } from './resumeParser';

test('extracts conservative profile details from resume text', () => {
  expect(profileFromResumeText(`
    Ada Lovelace
    Software Engineer
    ada@example.com | +44 20 1234 5678
    linkedin.com/in/ada-lovelace
    github.com/ada
    Summary
    Builds thoughtful software systems.
  `)).toMatchObject({
    name: 'Ada Lovelace',
    title: 'Software Engineer',
    email: 'ada@example.com',
    phone: '+44 20 1234 5678',
    linkedin: 'linkedin.com/in/ada-lovelace',
    github: 'ada',
    summary: 'Builds thoughtful software systems.',
  });
});

test('leaves uncertain fields blank', () => {
  expect(profileFromResumeText('Portfolio\nSome general text')).toMatchObject({
    email: '', phone: '', linkedin: '', github: '', summary: '',
  });
});
