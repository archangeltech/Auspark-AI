import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types.ts";

export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
  // Resolve API key safely from processed environment
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error(
      "API Key is missing. Please ensure API_KEY is set in your deployment environment variables."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const locationContext = location 
    ? `Location: Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}.`
    : "Location not provided.";

  const permitContext = `
    USER PERMITS (EXEMPTIONS):
    - Disability/MPS Permit: ${profile.hasDisabilityPermit}
    - Resident Permit: ${profile.hasResidentPermit} (Area: ${profile.residentArea || 'N/A'})
    - Loading Zone Permit: ${profile.hasLoadingZonePermit}
    - Business Permit: ${profile.hasBusinessPermit}
  `;

  const prompt = `
    Analyze the provided image of Australian parking sign(s).
    
    CRITICAL: Detect Arrows.
    - If arrows point in different directions, return results for 'left' and 'right'.
    - Otherwise, return direction 'general'.

    CONTEXT:
    - Time: ${currentTime}
    - Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    RULES:
    - ALWAYS use full words for durations (e.g., "1 hour", "30 minutes"). Do NOT use "1P", "2P".
    - Account for Disability (MPS) extensions: 1P -> 2 hours, 30min -> 2 hours.
    - Resident permits bypass time limits in matching areas.
    - Loading Zones require the loading zone permit.

    Return JSON matching the schema.
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
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  direction: { type: Type.STRING, enum: ["left", "right", "general"] },
                  status: { type: Type.STRING, enum: ["ALLOWED", "FORBIDDEN", "RESTRICTED", "UNKNOWN"] },
                  canParkNow: { type: Type.BOOLEAN },
                  summary: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  rules: { type: Type.ARRAY, items: { type: Type.STRING } },
                  permitRequired: { type: Type.BOOLEAN },
                  permitApplied: { type: Type.STRING, nullable: true },
                  nextStatusChange: { type: Type.STRING, nullable: true },
                  timeRemainingMinutes: { type: Type.NUMBER, nullable: true }
                },
                required: ["direction", "status", "canParkNow", "summary", "explanation", "rules", "permitRequired"]
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error("Empty AI response.");
    return JSON.parse(resultText) as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};