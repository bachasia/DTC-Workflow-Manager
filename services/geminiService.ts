
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Staff, TaskStatus } from "../types";
import { api } from "../src/services/api";


// Lazy initialization to prevent app crash if API key is missing
let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

const getAI = async () => {
  try {
    // Try to get user's custom API key from settings
    const settings = await api.settings.get();
    const userApiKey = settings?.settings?.geminiApiKey;

    // Use user's API key if available, otherwise fall back to environment variable
    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('Gemini API key not configured. AI features will be disabled.');
      return null;
    }

    // Reinitialize if API key changed
    if (!ai || currentApiKey !== apiKey) {
      ai = new GoogleGenAI({ apiKey });
      currentApiKey = apiKey;
    }

    return ai;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    // Fall back to environment variable on error
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!ai || currentApiKey !== apiKey) {
      ai = new GoogleGenAI({ apiKey });
      currentApiKey = apiKey;
    }
    return ai;
  }
};

export interface AnalyticalReport {
  productivityScore: number;
  brandFocus: { brand: string; count: number }[];
  priorityMix: { priority: string; count: number }[];
  completionRate: number;
  pendingTasksCount: number; // New field for non-DONE tasks
  narrativeSummary: string; // The Telegram formatted text
  managementInsight: string; // Internal advice for the manager
}

export const generateAnalyticalReport = async (staff: Staff, tasks: Task[]): Promise<AnalyticalReport> => {
  const staffTasks = tasks.filter(t => t.assignedTo === staff.id);

  const taskDetails = staffTasks.map(t => {
    return `Task: ${t.title}, Priority: ${t.priority}, Status: ${t.status}, Progress: ${t.progress}%, Blocker: ${t.blockerReason || 'None'}`;
  }).join('\n');

  const prompt = `
    Analyze the work performance for ${staff.name} (${staff.role}) based on these tasks:
    ${taskDetails}

    Context: Team DTC manages POD brands: Kozmozcyber, Littleowh, Ezcustomcar, otakusneak.
    
    Return a JSON object with the following schema:
    {
      "productivityScore": number (0-100 based on progress and priority weights),
      "brandFocus": [{ "brand": string, "count": number }] (Identify brands from task titles),
      "priorityMix": [{ "priority": string, "count": number }],
      "completionRate": number (percentage of tasks marked DONE),
      "pendingTasksCount": number (Count of tasks that are NOT in 'DONE' status),
      "narrativeSummary": string (A professional Telegram report with emojis, bolding, and bullet points. Mention the number of pending tasks explicitly),
      "managementInsight": string (A 2-sentence analytical advice for the manager about this staff member)
    }

    Note: The narrativeSummary should be ready to copy-paste into Telegram.
  `;

  try {
    const aiInstance = getAI();
    if (!aiInstance) {
      // Return mock data when AI is not available
      return {
        productivityScore: 75,
        brandFocus: [],
        priorityMix: [],
        completionRate: 0,
        pendingTasksCount: staffTasks.length,
        narrativeSummary: `Report for ${staff.name} - AI features disabled`,
        managementInsight: 'Configure VITE_GEMINI_API_KEY to enable AI analytics'
      };
    }

    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    return JSON.parse(response.text || '{}') as AnalyticalReport;
  } catch (error) {
    console.error("Analytical Report Error:", error);
    throw error;
  }
};

export const suggestDeadlines = async (taskDescription: string): Promise<string> => {
  const prompt = `
    As a project manager for a Print-on-Demand (POD) business managing stores like Kozmozcyber and Littleowh, 
    estimate how long this specific task should take:
    "${taskDescription}"
    Return a short response indicating a reasonable deadline (e.g., "4 hours", "2 days").
  `;

  try {
    const aiInstance = getAI();
    if (!aiInstance) {
      return "AI not configured";
    }

    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Unspecified";
  } catch (error) {
    return "Estimation unavailable";
  }
};
