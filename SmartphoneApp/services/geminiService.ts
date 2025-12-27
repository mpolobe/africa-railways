
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getRailAssistantResponse = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `You are the Africa Railways Smart Assistant. You help users with:
        1. Explaining how the AfriCoin Gold wallet works (exchange rates to NIGN, etc).
        2. Providing information about major rail routes across Africa (e.g., Lagos to Abuja, Cairo to Alexandria, Nairobi to Mombasa).
        3. Assisting with safety tips and reporting procedures.
        Keep responses concise, friendly, and helpful.`,
      },
    });
    return response.text || "I'm sorry, I couldn't process that. How can I help with your journey?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The assistant is currently offline. Please try again later.";
  }
};

export const analyzeReport = async (reportText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this railway incident report and categorize it: "${reportText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category of the report (e.g., Security, Maintenance, Delay)" },
            priority: { type: Type.STRING, description: "Priority level (Low, Medium, High)" },
            summary: { type: Type.STRING, description: "Brief 1-sentence summary" }
          },
          required: ["category", "priority", "summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Report Analysis Error:", error);
    return null;
  }
};
