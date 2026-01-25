
import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types";

export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API Key is missing. Please ensure API_KEY is set in your Vercel Environment Variables and redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = base64Image.split(',')[1] || base64Image;

  const locationContext = location 
    ? `Current Location: Lat ${location.lat}, Lng ${location.lng}.`
    : "Location unavailable. Assume standard Australian capital city rules.";

  const permitContext = `
    User Permits:
    - Disability/MPS: ${profile.hasDisabilityPermit ? 'YES' : 'NO'}
    - Resident: ${profile.hasResidentPermit ? `YES (Area: ${profile.residentArea || 'Not specified'})` : 'NO'}
    - Loading Zone: ${profile.hasLoadingZonePermit ? 'YES' : 'NO'}
    - Business: ${profile.hasBusinessPermit ? 'YES' : 'NO'}
  `;

  const prompt = `
    TASK: Determine if parking is allowed for the user's specific profile right now.
    
    CONTEXT:
    - Current Day: ${userDay}
    - Current Time: ${currentTime}
    - ${locationContext}
    - ${permitContext}

    AUSTRALIAN RULES PRIORITY (CRITICAL):
    1. NO STOPPING / CLEARWAY: If active, ALWAYS forbidden. Permits do NOT grant stopping rights here.
    2. LOADING ZONES: Only allowed if Loading Zone Permit = YES.
    3. TIMED PARKING: Check hours. If "Permit Holders Excepted" matches Resident Area, user can park indefinitely. 
    4. MPS (DISABILITY): In NSW/VIC, MPS holders often get 2x time or unlimited time in 30min+ zones.

    OUTPUT JSON:
    - status: "ALLOWED", "FORBIDDEN", or "RESTRICTED"
    - canParkNow: boolean
    - summary: A clear 4-5 word verdict.
    - explanation: Detail exactly why.
    - permitApplied: Name of permit if it enabled parking.
    - nextStatusChange: Time when the user MUST move the car.
    - timeRemainingMinutes: Minutes left until forbidden.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
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

    const resultText = response.text;
    if (!resultText) throw new Error("AI returned an empty response.");
    return JSON.parse(resultText) as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Interpretation Error:", error);
    throw new Error(error.message || "Analysis failed. Ensure your photo is clear.");
  }
};
