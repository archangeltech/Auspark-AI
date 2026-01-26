import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types";

export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
  // Vite replaces this string at build time. 
  // If it's empty in the browser, the Vercel build didn't have the environment variable.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error(
      "API Key is missing at runtime. Please: 1. Set API_KEY in Vercel. 2. Trigger a REDEPLOY in the Vercel 'Deployments' tab."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const locationContext = location 
    ? `Location: Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}.`
    : "Location not provided.";

  const prompt = `
    Analyze the Australian parking sign in the image.
    Can the user park right now?
    
    CONTEXT:
    - Time: ${currentTime}
    - Day: ${userDay}
    - ${locationContext}
    - Permits: Disability=${profile.hasDisabilityPermit}, Resident=${profile.hasResidentPermit}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            canParkNow: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            explanation: { type: Type.STRING },
            rules: { type: Type.ARRAY, items: { type: Type.STRING } },
            permitRequired: { type: Type.BOOLEAN },
            permitApplied: { type: Type.STRING },
            nextStatusChange: { type: Type.STRING },
            timeRemainingMinutes: { type: Type.NUMBER }
          },
          required: ["status", "canParkNow", "summary", "explanation", "rules", "permitRequired"]
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error("AI returned an empty response.");
    return JSON.parse(resultText) as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('429')) {
      throw new Error("Quota exceeded. Please wait 60s. Flash models usually have higher limits.");
    }
    throw error;
  }
};