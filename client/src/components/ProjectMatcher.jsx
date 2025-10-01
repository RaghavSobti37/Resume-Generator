import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getReadmeContent, generateProjectHighlights } from '../services/api';
 
const ProjectMatcher = ({ jobDescription, setJobDescription, matchedProjects, setMatchedProjects, projects, onNext, handleSaveData }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [highlightStates, setHighlightStates] = useState({});

    const handleProjectToggle = (projectId) => {
        // This function now only adds/removes the project from the selection
        setMatchedProjects(prevSelected => {
            const isSelected = prevSelected.some(p => p.id === projectId);
 if (isSelected) {
                return prevSelected.filter(p => p.id !== projectId);
            } else {
                const projectToAdd = projects.find(p => p.id === projectId);
                return [...prevSelected, projectToAdd];
            }
        });
    };

    const handleGenerateHighlights = async (project) => {
        if (!jobDescription) {
            alert("Please paste a job description first to generate tailored highlights.");
            return;
        }

        setHighlightStates(prev => ({ ...prev, [project.id]: { loading: true, error: null } }));

        try {
            const repoUrlParts = project.repo_url.split('/'); // e.g., ['github.com', 'username', 'repo-name']
            const githubUsername = repoUrlParts[1];
            const readmeContent = await getReadmeContent(githubUsername, project.name);
            const highlights = await generateProjectHighlights(project, readmeContent, jobDescription);

            // Update the specific project within the matchedProjects array
            setMatchedProjects(prev => prev.map(p => 
                p.id === project.id ? { ...p, highlights: highlights } : p
            ));
            setHighlightStates(prev => ({ ...prev, [project.id]: { loading: false, error: null } }));

        } catch (error) {
            console.error("Highlight generation failed:", error);
            alert(`Failed to generate highlights: ${error.message}`);
            setHighlightStates(prev => ({ ...prev, [project.id]: { loading: false, error: error.message } }));
        }
    };

    const handleSaveAndContinue = async () => {
        setIsSaving(true);
        // Save both the selected projects and the job description
        await handleSaveData({ 
            matchedProjects,
            jobDescription 
        });
        setIsSaving(false);
        onNext();
    };

    const isSelected = (projectId) => matchedProjects.some(p => p.id === projectId);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">2. Select Projects & Generate Highlights</h2>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description (for AI-powered highlights)</label>
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={8}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {projects.length > 0 ? projects.map(project => (
                    <div key={project.id} className={`p-4 rounded-lg border transition-all duration-200 ${isSelected(project.id) ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                        <label htmlFor={`project-${project.id}`} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id={`project-${project.id}`}
                                checked={isSelected(project.id)}
                                onChange={() => handleProjectToggle(project.id)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="ml-4">
                                <p className="font-semibold text-gray-800">{project.name}</p>
                                <p className="text-xs text-gray-500 italic">
                                    {project.tech_stack.join(' · ')}
                                </p>
                                {isSelected(project.id) && (
                                    <div className="mt-3">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); handleGenerateHighlights(project); }}
                                            disabled={highlightStates[project.id]?.loading}
                                            className="text-xs inline-flex items-center px-2.5 py-1.5 border border-transparent font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400"
                                        >
                                            {highlightStates[project.id]?.loading 
                                                ? <Loader2 className="h-4 w-4 animate-spin" /> 
                                                : <><Sparkles className="h-4 w-4 mr-1" /> Generate Highlights</>
                                            }
                                        </button>
                                        {project.highlights && <p className="text-xs text-green-600 mt-1">Highlights generated!</p>}
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 p-8">No projects found. Please go back to Step 1 and fetch your projects from GitHub.</p>
                )}
            </div>

            <button 
                onClick={handleSaveAndContinue} 
                disabled={isSaving}
                className={`mt-8 w-full font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : 'Save & Continue'}
            </button>
        </div>
    );
};

export default ProjectMatcher;
