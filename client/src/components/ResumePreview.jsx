import React, { useState } from 'react';
import { Printer, Download, Save, CheckCircle, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { generateSummary, generateProjectHighlights, getReadmeContent, generateProjectDescription, refineText } from '../services/api';
import RefineDropdown from './RefineDropdown';
import RefineHelpModal from './RefineHelpModal';

const ResumePreview = ({ userData, setUserData, projects, setProjects, allTechStack, handleSaveData, jobDescription }) => {

    const [isSaved, setIsSaved] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [generatingHighlights, setGeneratingHighlights] = useState({});
    const [generatingDescription, setGeneratingDescription] = useState({});
    const [refiningField, setRefiningField] = useState(null);
    const [lastRefined, setLastRefined] = useState(null); // For undo functionality
    const [showRefineHelp, setShowRefineHelp] = useState(false);
    
    const handleUserChange = (field, value) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const handleProjectChange = (index, field, value) => {
        if (typeof setProjects !== 'function') return; // Prevent crash if prop is not a function
        setProjects(prev => {
            const newProjects = [...prev];
            newProjects[index] = { ...newProjects[index], [field]: value };
            return newProjects;
        });
    };

    const handleSave = async () => {
        await handleSaveData({ userData, matchedProjects: projects });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000); // Show "Saved!" for 2 seconds
    };

    const handleGenerateSummary = async () => {
        if (!jobDescription) {
            alert("A job description is required to generate a summary.");
            return;
        }
        setGeneratingSummary(true);
        try {
            const result = await generateSummary(userData, projects, jobDescription);
            setUserData(prev => ({ ...prev, summary: result.summary }));
        } catch (error) {
            console.error("AI summary generation failed:", error);
            alert(`Failed to generate summary: ${error.message}`);
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleGenerateHighlights = async (project, index) => {
        if (!jobDescription) {
            alert("A job description is required to generate highlights.");
            return;
        }
        setGeneratingHighlights(prev => ({ ...prev, [project.id]: true }));
        try {
            const repoUrlParts = project.repo_url.split('/');
            const githubUsername = repoUrlParts[1];
            const readmeContent = await getReadmeContent(githubUsername, project.name);
            const highlights = await generateProjectHighlights(project, readmeContent, jobDescription);

            setProjects(prev => {
                const newProjects = [...prev];
                newProjects[index] = { ...newProjects[index], highlights };
                return newProjects;
            });
        } catch (error) {
            console.error("AI highlights generation failed:", error);
            alert(`Failed to generate highlights: ${error.message}`);
        } finally {
            setGeneratingHighlights(prev => ({ ...prev, [project.id]: false }));
        }
    };

    const handleGenerateDescription = async (project, index) => {
        setGeneratingDescription(prev => ({ ...prev, [project.id]: true }));
        try {
            const newDescription = await generateProjectDescription(project, jobDescription);
            setProjects(prev => {
                const newProjects = [...prev];
                newProjects[index] = { ...newProjects[index], description: newDescription };
                return newProjects;
            });
        } catch (error) {
            console.error("AI description generation failed:", error);
            alert(`Failed to generate description: ${error.message}`);
        } finally {
            setGeneratingDescription(prev => ({ ...prev, [project.id]: false }));
        }
    };

    const handleRefine = async (field, style, originalText, index = null) => {
        const fieldId = index !== null ? `${field}-${index}` : field;
        setRefiningField(fieldId);
        try {
            const refinedText = await refineText(originalText, style, jobDescription);
            if (field === 'summary') {
                setLastRefined({ fieldId, originalText: userData.summary });
                setUserData(prev => ({ ...prev, summary: refinedText }));
            } else if (field === 'projectDescription') {
                handleProjectChange(index, 'description', refinedText);
            } else if (field === 'skills') {
                setUserData(prev => ({ ...prev, allTechStack: refinedText.split(',').map(s => s.trim()) }));
            } else if (field === 'experienceTitle') {
                const newExperience = [...userData.experience];
                newExperience[index].title = refinedText;
                setUserData(prev => ({ ...prev, experience: newExperience }));
            } else if (field === 'experienceDescription') {
                // Assuming description is a single block of text for refinement
                const newExperience = [...userData.experience];
                newExperience[index].description = refinedText;
                setUserData(prev => ({ ...prev, experience: newExperience }));
            }
            setTimeout(() => setLastRefined(null), 5000); // Undo option disappears after 5 seconds
        } catch (error) {
            alert(`Failed to refine text: ${error.message}`);
        } finally {
            setRefiningField(null);
        }
    };

    const handleUndo = () => {
        if (!lastRefined) return;

        const { fieldId, originalText } = lastRefined;
        const [field, indexStr] = fieldId.split('-');
        const index = indexStr ? parseInt(indexStr, 10) : null;

        if (field === 'summary') {
            setUserData(prev => ({ ...prev, summary: originalText }));
        }
        // Add other undo logic here if needed for other fields

        setLastRefined(null); // Clear undo state
    };

    const renderUndoButton = (fieldId) => {
        if (lastRefined?.fieldId === fieldId) {
            return (
                <button onClick={handleUndo} className="ml-2 text-xs inline-flex items-center px-2 py-1 border border-transparent font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                    <RotateCcw className="h-3 w-3 mr-1" /> Undo
                </button>
            );
        }
        return null;
    };

    const handlePrint = () => {
        window.print();
    };

    const downloadJSON = () => {
        const data = {
            profile: userData,
            matchedProjects: projects,
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_data_${userData.name.toLowerCase().replace(/\s/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!userData) {
        return <div className="text-center p-8">Please select or create a profile first.</div>;
    }

    return (
        <div className="space-y-4">
            {showRefineHelp && <RefineHelpModal onClose={() => setShowRefineHelp(false)} />}
            <style>
                {`
                    @media print {
                        a[href]:after {
                            content: none !important;
                        }
                        .resume-container {
                            /* Force a standard, embeddable font to prevent character rendering issues in PDF */
                            font-family: 'Times New Roman', Times, serif !important;
                        }
                    }
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                `}
            </style>
            <div className="flex justify-center space-x-4 print:hidden">
                <button onClick={handlePrint} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition">
                    <Printer className="w-5 h-5 mr-2" /> Print/Save as PDF
                </button>
                <button onClick={downloadJSON} className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-md transition">
                    <Download className="w-5 h-5 mr-2" /> Download All Data (JSON)
                </button>
                <button onClick={handleSave} className={`flex items-center font-bold py-3 px-6 rounded-xl shadow-md transition ${isSaved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isSaved ? (
                        <><CheckCircle className="w-5 h-5 mr-2" /> Saved!</>
                    ) : (
                        <><Save className="w-5 h-5 mr-2" /> Save Changes</>
                    )}
                </button>
            </div>

            <div className="resume-container p-8 bg-white max-w-4xl mx-auto shadow-2xl border border-gray-100 rounded-xl" style={{ minHeight: '297mm' }}>
                <div className="border-b-2 border-gray-300 pb-4 mb-6 text-center">
                    <h1 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => handleUserChange('name', e.currentTarget.textContent)} 
                        className="text-4xl font-bold text-gray-800">{userData.name}</h1>
                    <p 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => handleUserChange('title', e.currentTarget.textContent)} 
                        className="text-lg font-medium text-indigo-600 mt-1">{userData.title}</p>
                    <div className="flex flex-wrap justify-center text-sm text-gray-600 space-x-4 mt-2">
                        <span
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={e => handleUserChange('phone', e.currentTarget.textContent)} 
                        >{userData.phone}</span>
                        <span>&bull;</span>
                        <span
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={e => handleUserChange('email', e.currentTarget.textContent)} 
                        >{userData.email}</span>
                        <span>&bull;</span>
                        <a 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={e => handleUserChange('linkedin', e.currentTarget.textContent)} 
                            href={`https://${userData.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">{userData.linkedin}</a>
                        <span>&bull;</span>
                        <a 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={e => handleUserChange('github', e.currentTarget.textContent.replace('github.com/', ''))}
                            href={`https://github.com/${userData.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">github.com/{userData.github}</a>
                    </div>
                </div>

                <section className="mb-6">
                    <div className="flex justify-between items-center border-b-2 border-gray-200 pb-1 mb-2 group">
                        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider">PROFESSIONAL SUMMARY</h2>
                        <div className="flex items-center">
                            {!userData.summary && (
                                <button onClick={handleGenerateSummary} disabled={generatingSummary} className="text-xs inline-flex items-center px-2 py-1 border border-transparent font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400">
                                    {generatingSummary
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <><Sparkles className="h-4 w-4 mr-1" /> Generate</>
                                    }
                                </button>
                            )}
                            {userData.summary && !lastRefined && (
                                <RefineDropdown onRefine={(style) => handleRefine('summary', style, userData.summary)} isLoading={refiningField === 'summary'} onHelpClick={() => setShowRefineHelp(true)} />
                            )}
                            {renderUndoButton('summary')}
                        </div>
                    </div>
                    <p 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => handleUserChange('summary', e.currentTarget.textContent)} 
                        className="text-gray-700 text-sm">{userData.summary}</p>
                </section>

                <section className="mb-6">
                    <div className="flex justify-between items-center border-b-2 border-gray-200 pb-1 mb-2 group">
                        <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider">TECHNICAL SKILLS</h2>
                        <RefineDropdown onRefine={(style) => handleRefine('skills', style, allTechStack.join(', '))} isLoading={refiningField === 'skills'} isDisabled={allTechStack.length === 0} onHelpClick={() => setShowRefineHelp(true)} />
                    </div>
                    <p 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => {
                            const newSkills = e.currentTarget.textContent.split(',').map(s => s.trim());
                            setUserData(prev => ({ ...prev, allTechStack: newSkills }));
                        }}
                        className="text-sm text-gray-700">
                        {allTechStack.join(', ')}
                    </p>
                </section>

                {projects.length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1 mb-2 uppercase tracking-wider">RELEVANT PROJECTS</h2>
                        {projects.map((p, index) => (
                            <div key={p.id} className="mb-4">
                                <div className="flex justify-between items-baseline">
                                    <h3 
                                        contentEditable 
                                        suppressContentEditableWarning 
                                        onBlur={e => handleProjectChange(index, 'name', e.currentTarget.textContent)} 
                                        className="text-md font-semibold text-gray-800">{p.name}</h3>
                                    <a 
                                        contentEditable 
                                        suppressContentEditableWarning 
                                        onBlur={e => handleProjectChange(index, 'repo_url', e.currentTarget.textContent)} 
                                        href={`https://${p.repo_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">{p.repo_url}</a>
                                </div>
                                <p 
                                    contentEditable 
                                    suppressContentEditableWarning 
                                    onBlur={e => handleProjectChange(index, 'tech_stack', e.currentTarget.textContent.split(' | ').map(s => s.trim()))} 
                                    className="text-xs font-semibold text-gray-600 mb-1">
                                    {p.tech_stack.join(' | ')}
                                </p>
                                <div className="flex items-start group">
                                    <p 
                                        contentEditable 
                                        suppressContentEditableWarning 
                                        onBlur={e => handleProjectChange(index, 'description', e.currentTarget.textContent)} 
                                        className="text-sm text-gray-700 mb-1 flex-grow">{p.description}</p>
                                    <button 
                                        onClick={() => !p.description && handleGenerateDescription(p, index)}
                                        disabled={generatingDescription[p.id]}
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 hover:text-teal-800 disabled:opacity-50"
                                        title={p.description ? "Refine with AI" : "Generate with AI"}
                                    >
                                        {generatingDescription[p.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    </button>
                                    <RefineDropdown onRefine={(style) => handleRefine('projectDescription', style, p.description, index)} isLoading={refiningField === `projectDescription-${index}`} isDisabled={!p.description} onHelpClick={() => setShowRefineHelp(true)} />
                                </div>
                                {(!p.highlights || p.highlights.length === 0) && (
                                     <div className="mt-2">
                                        <button
                                            onClick={() => handleGenerateHighlights(p, index)}
                                            disabled={generatingHighlights[p.id]}
                                            className="text-xs inline-flex items-center px-2 py-1 border border-transparent font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400"
                                        >
                                            {generatingHighlights[p.id]
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <><Sparkles className="h-4 w-4 mr-1" /> Generate Highlights</>
                                            }
                                        </button>
                                    </div>
                                )}
                                {p.highlights && p.highlights.length > 0 && (
                                    <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1 mt-2">
                                        {p.highlights.map((highlight, i) => (
                                            <li 
                                                key={i} 
                                                contentEditable 
                                                suppressContentEditableWarning
                                                onBlur={e => {
                                                    const newHighlights = [...p.highlights];
                                                    newHighlights[i] = e.currentTarget.textContent;
                                                    handleProjectChange(index, 'highlights', newHighlights);
                                                }}
                                            >{highlight}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                <section className="mb-6">
                    <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1 mb-2 uppercase tracking-wider">PROFESSIONAL EXPERIENCE</h2>
                    {(userData.experience || []).map((job, jobIndex) => (
                        <div key={jobIndex} className="mb-4">
                            <div className="flex justify-between items-baseline">
                                <h3 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    onBlur={e => handleUserChange('experience', userData.experience.map((j, i) => i === jobIndex ? { ...j, title: e.currentTarget.textContent } : j))}
                                    className="text-md font-semibold text-gray-800">{job.title}</h3>
                                <span 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    onBlur={e => handleUserChange('experience', userData.experience.map((j, i) => i === jobIndex ? { ...j, dates: e.currentTarget.textContent } : j))}
                                    className="text-sm text-gray-500">{job.dates}</span>
                            </div>
                            <p 
                                contentEditable 
                                suppressContentEditableWarning
                                onBlur={e => handleUserChange('experience', userData.experience.map((j, i) => i === jobIndex ? { ...j, organization: e.currentTarget.textContent } : j))}
                                className="italic text-indigo-600 text-sm mb-1">{job.organization}</p>
                            <div className="group relative mt-2">
                                <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <RefineDropdown onRefine={(style) => handleRefine('experienceDescription', style, job.description, jobIndex)} isLoading={refiningField === `experienceDescription-${jobIndex}`} isDisabled={!job.description} />
                                </div>
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={e => {
                                        // To preserve bullet points, we get innerHTML and convert divs/brs to newlines
                                        const newDesc = e.currentTarget.innerText;
                                        handleUserChange('experience', userData.experience.map((j, idx) => idx === jobIndex ? { ...j, description: newDesc } : j));
                                    }}
                                    className="list-disc ml-5 text-gray-700 text-sm space-y-1"
                                    dangerouslySetInnerHTML={{
                                        __html: (job.description || '')
                                            .split('\n')
                                            .filter(line => line.trim())
                                            .map(line => `<li>${line.replace(/^-/, '').trim()}</li>`)
                                            .join('')
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </section>
                
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1 mb-2 uppercase tracking-wider">EDUCATION</h2>
                    {(userData.education || []).map((edu, eduIndex) => (
                        <div key={eduIndex} className="mb-2">
                            <div className="flex justify-between items-baseline">
                                <h3 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    onBlur={e => handleUserChange('education', userData.education.map((ed, i) => i === eduIndex ? { ...ed, title: e.currentTarget.textContent } : ed))}
                                    className="text-md font-semibold text-gray-800">{edu.title}</h3>
                                <span 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    onBlur={e => handleUserChange('education', userData.education.map((ed, i) => i === eduIndex ? { ...ed, dates: e.currentTarget.textContent } : ed))}
                                    className="text-sm text-gray-500">{edu.dates}</span>
                            </div>
                            <p 
                                contentEditable 
                                suppressContentEditableWarning
                                onBlur={e => handleUserChange('education', userData.education.map((ed, i) => i === eduIndex ? { ...ed, organization: e.currentTarget.textContent } : ed))}
                                className="italic text-indigo-600 text-sm">{edu.organization}</p>
                        </div>
                    ))}
                </section>

                <section className="mt-8 text-center text-xs text-gray-400 print:text-gray-500">
                    <p>
                        Generated with AI Resume Generator by Raghav Sobti &bull;{' '}
                        <a href="https://github.com/RaghavSobti37/Resume-Generator" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                            View Project on GitHub
                        </a>
                    </p>
                </section>

            </div>
        </div>
    );
};

export default ResumePreview;