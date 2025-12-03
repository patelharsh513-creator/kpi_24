// @ts-nocheck
import { GoogleGenAI } from "@google/genai";
import { DailyRecord } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  // Check localStorage first (in case user added one in settings), then fallback to process.env
  let apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : '';

  if (!apiKey) {
     apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  }
  
  // Hardcoded fallback if process.env isn't set (safety net)
  if (!apiKey) {
      apiKey = "AIzaSyD8Z3UWYD6Djnim8WJjEC-42gPrHzvzhdA"; // This is a placeholder, encourage users to use their own key
  }

  if (!apiKey || apiKey.length < 10) { // Basic validation
      return null;
  }
  
  // Singleton instance
  if (!aiInstance) {
      aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
};

export const generateKpiInsights = async (dailyData: DailyRecord, weeklyStats?: { combinedFixedStops: number }, previousWeekRecord?: DailyRecord): Promise<string> => {
  if (!dailyData) {
    return "Enter data to get insights.";
  }

  const {
      date,
      totalRevenue,
      totalLogisticCost,
      netProfit,
  } = dailyData;

  const prompt = `
    Analyze logistics for ${date}.
    Revenue: ${totalRevenue}, Cost: ${totalLogisticCost}, Profit: ${netProfit}.
    Provide:
    1. Comparison vs Last Week.
    2. Efficiency check.
    3. Action plan.
  `;

  try {
    const ai = getAiClient();
    
    if (!ai) {
        return "AI Key missing. Please open settings and add your Gemini API Key.";
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
  } catch (error: any) {
    // Gracefully handle quota/rate limit errors without logging as critical failures
    if (error.message && (error.message.includes("429") || error.message.includes("503") || error.message.includes("quota"))) {
        return "Usage limit reached. Add your own API Key in Settings to restore AI features.";
    }
    
    // Only log actual unexpected errors
    console.error("Gemini API Error:", error);
    return "AI Analysis temporarily unavailable.";
  }
};