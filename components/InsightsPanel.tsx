

import React, { useState, useEffect, useCallback } from 'react';
import { DailyRecord } from './types';
import { generatekpiInsights } from './geminiService';
import { ErrorMessage } from './ErrorMessage';
import { Bot, Sparkles } from 'lucide-react';

const formatInsights = (text: string) => {
    return text
        .split('\n')
        .map((line, index) => {
            line = line.trim();
            if (line.startsWith('**') && line.endsWith('**')) {
                return <h4 key={index} className="font-bold text-cyan-300 mt-4 mb-1">{line.replace(/\*\*/g, '')}</h4>;
            }
             // Handle numbered lists and bullet points
            if (line.match(/^(\d\.|-|\*)\s/)) {
                return <li key={index} className="ml-4 list-disc text-gray-300 my-1">{line.substring(line.indexOf(' ')+1)}</li>;
            }
            if (line) {
                return <p key={index} className="text-gray-300 my-2">{line}</p>;
            }
            return null;
        }).filter(Boolean);
};

interface InsightsPanelProps {
    dailyData: DailyRecord;
    weeklyStats: { combinedFixedStops: number };
    previousWeekRecord?: DailyRecord;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ dailyData, weeklyStats, previousWeekRecord }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!dailyData || dailyData.totalRevenue === 0) {
        setInsights("Enter today's revenue and costs to get real-time AI advice.");
        return;
    };
    setIsLoading(true);
    setError(null);
    try {
      const result = await generatekpiInsights(dailyData, weeklyStats, previousWeekRecord);
      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [dailyData, weeklyStats, previousWeekRecord]);

  useEffect(() => {
      const handler = setTimeout(() => {
        fetchInsights();
      }, 1000); // Debounce API calls while user is typing
      
      return () => clearTimeout(handler);
  }, [dailyData, weeklyStats, previousWeekRecord, fetchInsights]); 

  return (
    <div className="bg-gray-800 rounded-lg p-6 sticky top-24 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Bot className="w-7 h-7 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">AI Logistics Cost Advisor</h2>
      </div>
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
          <p className="mt-4 text-sm text-gray-400">Analyzing latest data...</p>
        </div>
      )}

      {error && <ErrorMessage message={error} onClear={() => setError(null)} />}

      {insights && !isLoading && (
        <div className="prose prose-sm prose-invert max-w-none text-gray-300">
            {formatInsights(insights)}
        </div>
      )}

      <button
        onClick={fetchInsights}
        disabled={isLoading}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-md hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        <Sparkles className="w-4 h-4" />
        {isLoading ? 'Regenerating...' : 'Regenerate Analysis'}
      </button>
    </div>
  );
};
