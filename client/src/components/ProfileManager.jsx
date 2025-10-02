import React, { useState, useEffect } from 'react';
import { fetchGitHubData } from '../services/api';
import { Loader2, Github, Briefcase } from 'lucide-react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

export const defaultUserData = {
    name: 'Your Name',
    title: 'Professional Title',
    email: 'your.email@example.com',
    phone: '', // Will store the full E.164 number, e.g., +15551234567
    linkedin: 'linkedin.com/in/your-profile',
    github: '',
    summary: 'Your AI-generated summary will appear here after matching with a job description.',
    experience: [],
    education: []
};

const Input = ({ name, label, value, onChange, placeholder = '' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
    </div>
);

const TextArea = ({ name, label, value, onChange, placeholder = '' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
    </div>
);

const JobItem = ({ index, type, data, handleArrayChange, removeField }) => (
    <div className="p-4 border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
        <h4 className="font-semibold text-indigo-700 mb-2">{type === 'experience' ? 'Job' : 'Degree'} #{index + 1}</h4>
        <Input label={type === 'experience' ? 'Title/Role' : 'Degree'} value={data.title || ''} onChange={(e) => handleArrayChange(e, index, type, 'title')} />
        <Input label={type === 'experience' ? 'Company' : 'Institution'} value={data.organization || ''} onChange={(e) => handleArrayChange(e, index, type, 'organization')} />
        <Input label='Dates' value={data.dates || ''} onChange={(e) => handleArrayChange(e, index, type, 'dates')} />
        {type === 'experience' && <TextArea label='Description (use bullet points)' value={data.description || ''} onChange={(e) => handleArrayChange(e, index, type, 'description')} />}
        <button type="button" onClick={() => removeField(type, index)} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium transition">Remove</button>
    </div>
);


const ProfileManager = ({ setProjects, userData, setUserData, handleSaveData, setCurrentStep }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleArrayChange = (e, index, type, field) => {
        const { value } = e.target;
        setUserData(prev => {
            const newArray = [...(prev[type] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [type]: newArray };
        });
    };

    const addField = (type) => {
        const defaultValue = type === 'experience' 
            ? { title: '', organization: '', dates: '', description: '' }
            : { title: '', organization: '', dates: '' };
        setUserData(prev => ({ ...prev, [type]: [...(prev[type] || []), defaultValue] }));
    };

    const removeField = (type, index) => {
        setUserData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    };

    const handleFetchGitHub = async () => {
        if (!userData.github) {
            alert("Please enter a GitHub username first.");
            return;
        }
        setIsSaving(true);
        try {
            const { profile, repos } = await fetchGitHubData(userData.github);
            const updatedProfile = { ...userData, ...profile };
            setUserData(updatedProfile);
            setProjects(repos);
            await handleSaveData({ 
                userData: updatedProfile,
                projects: repos 
            });
            alert(`Successfully fetched ${repos.length} repositories for ${profile.name}.`);
        } catch (error) {
            alert(`Failed to fetch GitHub data: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndContinue = async () => {
        setIsSaving(true);
        await handleSaveData({ userData: userData });
        setIsSaving(false);
        setCurrentStep(); // This will now call handleStepClick(2) in App.js
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">1. Your Personal Profile</h2>
            
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" name="name" value={userData.name || ''} onChange={handleInputChange} placeholder="e.g., 'My SWE Profile'" />
                    <Input label="Professional Title" name="title" value={userData.title || ''} onChange={handleInputChange} placeholder="Senior Software Engineer" />
                    <Input label="Email" name="email" value={userData.email || ''} onChange={handleInputChange} placeholder="your@email.com" />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <PhoneInput
                            placeholder="Enter phone number"
                            value={userData.phone}
                            onChange={(value) => setUserData(prev => ({ ...prev, phone: value }))}
                            className="phone-input" />
                    </div>
                    <Input label="LinkedIn Profile" name="linkedin" value={userData.linkedin || ''} onChange={handleInputChange} placeholder="linkedin.com/in/your-profile" />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">GitHub Username</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" name="github" value={userData.github || ''} onChange={handleInputChange} placeholder="your-username" className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
                            <button onClick={handleFetchGitHub} disabled={isSaving} className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Github className="w-5 h-5 mr-2" /> Fetch</>}
                            </button>
                        </div>
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> Professional Experience</h3>
                {(userData.experience || []).map((data, index) => <JobItem key={index} index={index} type="experience" data={data} handleArrayChange={handleArrayChange} removeField={removeField} />)}
                <button onClick={() => addField('experience')} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg border border-indigo-200 transition">Add Experience</button>
                <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.216"></path><path d="M12 21v-8M9 18l3 3 3-3"></path></svg> Education</h3>
                {(userData.education || []).map((data, index) => <JobItem key={index} index={index} type="education" data={data} handleArrayChange={handleArrayChange} removeField={removeField} />)}
                <button onClick={() => addField('education')} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg border border-indigo-200 transition">Add Education</button>
                <button onClick={handleSaveAndContinue} disabled={isSaving} className={`mt-8 w-full font-bold py-3 px-4 rounded-xl shadow-md transition duration-200 flex items-center justify-center ${isSaving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : 'Save Profile & Continue'}
                </button>
            </>
        </div>
    );
};

export default ProfileManager;