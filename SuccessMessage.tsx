import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onClear: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="fixed top-24 right-4 md:right-8 z-50 animate-in slide-in-from-right fade-in duration-300 pointer-events-auto">
      <div className="bg-gray-800 border border-gray-700 border-l-4 border-l-green-500 text-gray-100 px-5 py-4 rounded-lg shadow-2xl flex items-start gap-4 min-w-[320px] max-w-md backdrop-blur-sm bg-opacity-95">
        <div className="bg-green-900/30 p-2 rounded-full flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-grow pt-1">
            <p className="font-bold text-green-400 text-sm uppercase tracking-wider mb-1">Success</p>
            <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>
        <button 
            onClick={onClear} 
            className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-md -mr-1 -mt-1"
        >
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};