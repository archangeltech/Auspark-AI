import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types.ts";

export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
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
    - Disability Permit (MPS/ADP): ${profile.hasDisabilityPermit}
    - Resident Permit: ${profile.hasResidentPermit} (Area: ${profile.residentArea || 'N/A'})
    - Loading Zone Permit: ${profile.hasLoadingZonePermit}
    - Business Permit: ${profile.hasBusinessPermit}
  `;

  const prompt = `
    Analyze the provided image of Australian parking sign(s).
    
    CRITICAL: Detect Arrows for Left and Right sides.

    CONTEXT:
    - Time: ${currentTime}
    - Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    AUSTRALIAN PARKING RULES TO APPLY:
    1. Disability Permits: 1P -> 2H, 1/2P -> 2H. Often allow double time in green-sign time-limited bays.
    2. Resident Permits: Exempt from 'Permit Zone' and time limits in matching 'Area' zones.
    3. Loading Zones: Require appropriate commercial or loading zone permits.
    4. Business Permits: Often allow parking in specific trader or business zones.

    Return JSON with interpretation results for each direction.
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