import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from './hooks/useFirebase';
import ProfileManager, { defaultUserData } from './components/ProfileManager';
import ProjectMatcher from './components/ProjectMatcher';
import ResumePreview from './components/ResumePreview';
import StepIndicator, { steps } from './components/StepIndicator';
import { Loader2 } from 'lucide-react';

const APP_ID = process.env.REACT_APP_ID || 'default-app-id';

function App() {
    const { db, userId, isLoading } = useFirebase();
    const [userData, setUserData] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [projects, setProjects] = useState([]);
    const [matchedProjects, setMatchedProjects] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);

    const allTechStack = useMemo(() => {
        return Array.from(new Set(projects.flatMap(p => p.tech_stack))).sort();
    }, [projects]);

    const dataPath = useMemo(() => userId ? `artifacts/${APP_ID}/users/${userId}` : null, [userId]);

    useEffect(() => {
        if (db && userId) {
            const docRef = doc(db, dataPath, 'resumeData', 'main');
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                // Also check for a step in localStorage for faster reloads
                const savedStep = localStorage.getItem('currentStep');
                if (savedStep) {
                    setCurrentStep(JSON.parse(savedStep));
                }

                if (docSnap.exists()) {
                    const firestoreData = docSnap.data();
                    setUserData(firestoreData.userData || defaultUserData);
                    setJobDescription(firestoreData.jobDescription || '');
                    setProjects(firestoreData.projects || []);
                    setMatchedProjects(firestoreData.matchedProjects || []);
                } else {
                    // If no document exists, initialize with default data
                    setUserData(defaultUserData);
                }
            }, (error) => {
                console.error("Error listening to document:", error);
            });
            return () => unsubscribe();
        }
    }, [db, dataPath, userId]);

    // Save current step to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('currentStep', JSON.stringify(currentStep));
    }, [currentStep]);

    const handleSaveData = useCallback(async (dataToSave, merge = true) => {
        if (!db || !userId) return;
        try {
            const docRef = doc(db, dataPath, 'resumeData', 'main');
            await setDoc(docRef, dataToSave, { merge });
            console.log("Data saved successfully.");
        } catch (error) {
            console.error("Error saving document:", error);
        }
    }, [db, dataPath, userId]);

    const handleStepClick = (stepId) => {
        // Allow navigating backwards freely
        if (stepId < currentStep) {
            setCurrentStep(stepId);
            return;
        }

        // Validate before moving forwards
        if (currentStep === 1 && stepId > 1) {
            if (!userData.github || projects.length === 0) {
                alert("Please enter your GitHub username and fetch your projects before continuing.");
                return;
            }
        }
        if (currentStep === 2 && stepId > 2) {
            if (matchedProjects.length === 0) {
                alert("Please select at least one project to include in your resume.");
                return;
            }
        }
        setCurrentStep(stepId);
    };

    if (isLoading || !userId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 mr-2 animate-spin text-indigo-600" />
                <span className="text-lg text-indigo-700">Loading Application and Authenticating...</span>
            </div>
        );
    }
    
    const renderContent = () => {
        switch (currentStep) {
            case 1:
                return <ProfileManager 
                    setProjects={setProjects}
                    userData={userData}
                    setUserData={setUserData}
                    handleSaveData={handleSaveData}
                    setCurrentStep={() => handleStepClick(2)}
                />;
            case 2:
                return <ProjectMatcher
                    jobDescription={jobDescription}
                    setJobDescription={setJobDescription}
                    userData={userData}
                    setUserData={setUserData}
                    matchedProjects={matchedProjects}
                    setMatchedProjects={setMatchedProjects}
                    projects={projects}
                    onNext={() => handleStepClick(3)}
                    handleSaveData={handleSaveData}
                />;
            case 3:
                return (
                    userData && <ResumePreview 
                        userData={userData}
                        setUserData={setUserData}
                        projects={matchedProjects}
                        setProjects={setMatchedProjects}
                        allTechStack={allTechStack}
                        jobDescription={jobDescription}
                        handleSaveData={handleSaveData}
                    />
                );
            default:
                return <div>Invalid Step</div>;
        }
    };

    // Don't render the main content until user data is loaded
    if (!userData) {
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .resume-container { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; }
                    .print-break-avoid { page-break-inside: avoid; }
                }
            `}</style>
            
            <header className="print:hidden mb-8 bg-white p-4 rounded-xl shadow-lg border-t-4 border-indigo-600">
                <h1 className="text-3xl font-extrabold text-gray-800">AI Resume Builder</h1>
                <p className="text-gray-500">Intelligently customize your profile for any job description.</p>
                
                <div className="flex justify-between sm:justify-center mt-6 space-x-2 sm:space-x-8">
                    {steps.map((step) => (
                        <StepIndicator key={step.id} step={step} currentStep={currentStep} onStepClick={handleStepClick} />
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto pb-10">
                {renderContent()}
                
                <div className="mt-8 flex justify-between max-w-lg mx-auto print:hidden">
                    {currentStep > 1 && currentStep < 3 && (
                        <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        >
                            &larr; Back
                        </button>
                    )}
                    {currentStep === 3 && (
                        <button
                            onClick={() => setCurrentStep(2)}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        >
                            &larr; Re-Match Projects
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
