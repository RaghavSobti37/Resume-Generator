import React from 'react';
import { Printer, Download } from 'lucide-react';

const ResumePreview = ({ userData, setUserData, projects, setProjects, allTechStack }) => {

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
                    <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1 mb-2 uppercase tracking-wider">PROFESSIONAL SUMMARY</h2>
                    <p 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => handleUserChange('summary', e.currentTarget.textContent)} 
                        className="text-gray-700 text-sm">{userData.summary}</p>
                </section>

                <section className="mb-6">
                    <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1 mb-2 uppercase tracking-wider">TECHNICAL SKILLS</h2>
                    <p 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={e => {
                            const newSkills = e.currentTarget.textContent.split(',').map(s => s.trim());
                            // This is a bit tricky as allTechStack is derived. We'll update the source of truth.
                            // For now, let's assume the parent handles this logic if we pass up the raw text.
                            // This is a simplification.
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
                                <p 
                                    contentEditable 
                                    suppressContentEditableWarning 
                                    onBlur={e => handleProjectChange(index, 'description', e.currentTarget.textContent)} 
                                    className="text-sm text-gray-700 mb-1">{p.description}</p>
                                {p.highlights && (
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
                            <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                                {job.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                    <li 
                                        key={i}
                                        contentEditable 
                                        suppressContentEditableWarning
                                        onBlur={e => {
                                            const newDesc = job.description.split('\n');
                                            newDesc[i] = e.currentTarget.textContent;
                                            handleUserChange('experience', userData.experience.map((j, idx) => idx === jobIndex ? { ...j, description: newDesc.join('\n') } : j));
                                        }}
                                    >{line.replace(/^-/, '').trim()}</li>
                                ))}
                            </ul>
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