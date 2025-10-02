import React from 'react';

export const steps = [
    { id: 1, name: 'Manage Profile' },
    { id: 2, name: 'Match to Job' },
    { id: 3, name: 'Finalize & Export' },
];

const StepIndicator = ({ step, currentStep, onStepClick }) => {
    const isCompleted = currentStep > step.id;
    const isActive = currentStep === step.id;

    return (
        <div
            onClick={() => onStepClick(step.id)}
            className="flex items-center cursor-pointer group"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                {isCompleted ? '✓' : step.id}
            </div>
            <div className={`ml-3 text-sm font-medium transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                {step.name}
            </div>
            {step.id < steps.length && (
                <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
            )}
        </div>
    );
};

export default StepIndicator;