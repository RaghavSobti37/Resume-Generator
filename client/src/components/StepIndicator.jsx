import React from 'react';
import { User, Zap, FileText, ChevronRight, Check } from 'lucide-react';

export const steps = [
    { id: 1, name: 'Manage Profile', icon: User },
    { id: 2, name: 'Match to Job', icon: Zap },
    { id: 3, name: 'Finalize & Export', icon: FileText },
];

const StepIndicator = ({ step, currentStep }) => {
    const Icon = step.icon;
    const isActive = step.id === currentStep;
    const isComplete = step.id < currentStep;

    return (
        <div className={`flex items-center space-x-2 transition-all duration-300 ${isActive ? 'text-indigo-600 font-semibold' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${isActive ? 'border-indigo-600 bg-indigo-50' : isComplete ? 'border-green-600 bg-green-100' : 'border-gray-300 bg-white'}`}>
                {isComplete ? <Check size={18} /> : <Icon size={18} />}
            </div>
            <span className="hidden sm:inline">{step.name}</span>
            {step.id < steps.length && (
                <ChevronRight className="w-5 h-5 text-gray-300 hidden sm:inline" />
            )}
        </div>
    );
};

export default StepIndicator;