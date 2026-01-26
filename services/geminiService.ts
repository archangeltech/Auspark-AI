import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types";

// Interpret parking sign using Gemini 3 Flash for high speed and higher free-tier quota availability
export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
  // Always initialize with the environment variable directly
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error(
      "API Key is missing. Please ensure 'API_KEY' is set in your Vercel Environment Variables and redeploy."
    );
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
    TASK: Analyze the parking sign image and determine if the user can park right now.
    
    CURRENT STATUS:
    - Day: ${userDay}
    - Time: ${currentTime}
    - ${locationContext}
    - User Permits: ${permitContext}

    AUSTRALIAN PARKING RULES & PRIORITY:
    1. Clearways/No Stopping: Absolute priority. No parking allowed.
    2. Loading Zones: Only if user has Loading Zone Permit.
    3. Disability (MPS): Holders often get extra time (e.g., double time or unlimited in some councils).
    4. Resident Permits: Exempt from timed restrictions in their specific zone.

    Provide a concise, accurate verdict.
  `;

  try {
    // Switching to gemini-3-flash-preview to resolve 429 RESOURCE_EXHAUSTED errors.
    // Flash models are much more accessible on the free tier.
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
            status: { type: Type.STRING, description: "ALLOWED, FORBIDDEN, or RESTRICTED" },
            canParkNow: { type: Type.BOOLEAN },
            summary: { type: Type.STRING, description: "Short verdict (e.g. 'Park here for 2 hours')" },
            explanation: { type: Type.STRING, description: "Detailed reason why" },
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
    if (!resultText) throw new Error("AI response was empty.");
    return JSON.parse(resultText) as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Interpretation Error:", error);
    
    // Specifically catch and explain quota errors for better user experience
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Free tier limit reached. Please wait 60 seconds and try again. For permanent access, consider enabling billing on your Google AI project.");
    }
    
    throw new Error(error.message || "Could not analyze sign. Try a closer, clearer photo.");
  }
};