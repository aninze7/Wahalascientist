import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WahalaContent {
  shortResponse: string;
  script: string;
}

export const generateWahalaContent = async (complaint: string): Promise<WahalaContent> => {
  console.log("Gemini Service: Generating content for complaint", complaint.substring(0, 50) + "...");
  const systemPrompt = `
    You are the "Wahala Scientist". You turn health complaints into two things: 
    1. A "shortResponse": Bold, pithy, in Nigerian Pidgin/English mix, speaking truth to power. Start with "Listen up! The Wahala Scientist don arrive." The response MUST be in Pidgin, telling them they will be the first to receive the visual story and that "we dey for them".
    2. A "script": A gritty 4-panel visual comic script for social media amplification.
  `;

  const userQuery = `Health Complaint: ${complaint}`;

  try {
    console.log("Gemini Service: Calling AI model...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortResponse: { type: Type.STRING },
            script: { type: Type.STRING }
          },
          required: ["shortResponse", "script"]
        }
      }
    });

    const text = response.text;
    console.log("Gemini Service: AI response received", !!text);
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Service: API Error:", error);
    throw error;
  }
};
