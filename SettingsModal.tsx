import React, { useState, useEffect } from 'react';
import { X, Save, Key, Database, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [firebaseKey, setFirebaseKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('gemini_api_key') || '');
      setFirebaseKey(localStorage.getItem('firebase_api_key') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (geminiKey) localStorage.setItem('gemini_api_key', geminiKey.trim());
    if (firebaseKey) localStorage.setItem('firebase_api_key', firebaseKey.trim());
    
    // Reload to apply changes to services
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">App Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400">
            Keys are stored securely in your browser's Local Storage.
          </p>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-cyan-300">
              <span className="flex items-center gap-2"><Key className="w-4 h-4" /> Gemini API Key</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                Get Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500">Required for AI Insights. Fixes "Quota Exceeded" errors.</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-yellow-300">
              <Database className="w-4 h-4" />
              Firebase API Key
            </label>
            <input
              type="password"
              value={firebaseKey}
              onChange={(e) => setFirebaseKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
            />
             <p className="text-xs text-gray-500">Required for Saving Data.</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
};