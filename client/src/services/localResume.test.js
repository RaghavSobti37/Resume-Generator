import { rankProjects } from './localResume';

test('ranks projects by job-description technology matches', () => {
  const projects = [
    { id: '1', name: 'Photo Cleaner', description: 'Browser image utility', tech_stack: ['JavaScript', 'Browser APIs'] },
    { id: '2', name: 'ERP', description: 'Inventory platform', tech_stack: ['React', 'Node.js'] },
    { id: '3', name: 'Portfolio', description: 'Personal website', tech_stack: ['HTML', 'CSS'] },
  ];

  expect(rankProjects(projects, 'React developer with Node.js and JavaScript experience')).toEqual(['2', '1', '3']);
});

test('keeps project order when no job-description terms match', () => {
  const projects = [
    { id: 'first', name: 'First', description: '', tech_stack: [] },
    { id: 'second', name: 'Second', description: '', tech_stack: [] },
  ];

  expect(rankProjects(projects, 'Kubernetes')).toEqual(['first', 'second']);
});
