
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

export const transcribeAudio = async (audioData: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: audioData,
            },
          },
          {
            text: "Transcribe the following audio recording accurately. The recording is an observation report for a railway infrastructure project. If the language is not English, translate it to English. Return only the transcript text.",
          },
        ],
      },
    });

    return response.text || "No transcription available.";
  } catch (error) {
    console.error("Transcription error:", error);
    return "Transcription failed. Please try again or type manually.";
  }
};

export const generateDeploymentSummary = async (reports: any[]): Promise<string> => {
  try {
    const reportSummary = reports.map(r => `Location: ${r.location}, Observations: ${r.observations}`).join('\n---\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a concise, professional technical commit message for a GitHub repository based on these field reports. 
      Format it as:
      feat(ops): [Short Summary]
      
      - [Key Point 1]
      - [Key Point 2]
      
      Reports:
      ${reportSummary}`,
    });

    return response.text || "feat(ops): batch update from sovereign hub";
  } catch (error) {
    console.error("Deployment summary error:", error);
    return "feat(ops): standard infrastructure batch update";
  }
};

export const askAI = async (message: string, history: any[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are the Sovereign Hub AI, a technical assistant for Africa Railways field operators. Provide concise, expert advice on rail maintenance, reporting protocols, and infrastructure standards. Be professional and encouraging.",
      }
    });
    
    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Operational error. Check uplink connection.";
  }
};
