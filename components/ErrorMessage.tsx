import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClear: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-start" role="alert">
      <AlertTriangle className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
      <div className="flex-grow">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      <button onClick={onClear} className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
