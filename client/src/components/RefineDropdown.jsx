import React, { useState } from 'react';
import { Loader2, Sparkles, HelpCircle } from 'lucide-react';

const RefineDropdown = ({ onRefine, isLoading, isDisabled, onHelpClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const styles = ['Impact', 'Target', 'Brevity', 'Clarity', 'Assurance'];

    const handleSelect = (style) => {
        onRefine(style.toLowerCase().replace(' ', '-'));
        setIsOpen(false);
    };

    if (isLoading) {
        return <Loader2 className="h-4 w-4 animate-spin text-teal-600" />;
    }

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isDisabled}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600 hover:text-teal-800 disabled:opacity-50"
                    title="Refine with AI"
                >
                    <Sparkles className="h-4 w-4" />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2 flex justify-between items-center border-b">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Refine Style</p>
                        <button onClick={onHelpClick} className="text-gray-400 hover:text-indigo-600">
                            <HelpCircle className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {styles.map(style => (
                            <a key={style} href="#" onClick={(e) => { e.preventDefault(); handleSelect(style); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">{style}</a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefineDropdown;