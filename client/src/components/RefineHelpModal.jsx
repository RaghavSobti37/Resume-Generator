import React from 'react';
import { X } from 'lucide-react';

const stylesInfo = [
    {
        name: 'Impact',
        description: 'Enhances weak statements by incorporating strong action verbs and focusing the narrative on measurable results and project influence.',
        example: 'Before: "I was responsible for the backend." → After: "Engineered a high-availability backend service, improving API response times by 30%."'
    },
    {
        name: 'Target',
        description: 'Rephrases the selected text to strategically incorporate keywords from the last pasted job description.',
        example: 'Boosts the resume\'s relevance score against the job requirements.'
    },
    {
        name: 'Brevity',
        description: 'Executes a conciseness pass, eliminating filler words and condensing phrases to maximize information density without losing technical detail.',
        example: 'Before: "It is a tool that was made for the purpose of..." → After: "A tool designed to..."'
    },
    {
        name: 'Clarity',
        description: 'Standardizes complex or fragmented sentences, converts passive voice to active voice, and ensures smooth, logical flow between ideas.',
        example: 'Before: "The system was upgraded by me." → After: "I upgraded the system."'
    },
    {
        name: 'Assurance',
        description: 'Refines the tone by removing any hesitant language and replacing it with terminology that conveys unwavering confidence and expertise.',
        example: 'Before: "I helped to manage the project." → After: "Expertly managed the project lifecycle from conception to deployment."'
    }
];

const RefineHelpModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">AI Refinement Options</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {stylesInfo.map(style => (
                        <div key={style.name} className="p-3 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-indigo-700">{style.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                            <p className="text-xs text-gray-500 italic mt-2">{style.example}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RefineHelpModal;