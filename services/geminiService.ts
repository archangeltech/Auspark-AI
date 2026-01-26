import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types";

// Interpret parking sign using Gemini 3 Pro for complex visual reasoning and logic tasks
export const interpretParkingSign = async (
  base64Image: string,
  currentTime: string,
  userDay: string,
  profile: UserProfile,
  location?: { lat: number; lng: number }
): Promise<ParkingInterpretation> => {
  // Always initialize with the environment variable directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    // Upgrade to gemini-3-pro-preview for high-quality complex reasoning on visual data
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        // Letting the model manage reasoning tokens for better accuracy
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

    // Access the .text property directly (not a method)
    const resultText = response.text?.trim();
    if (!resultText) throw new Error("AI response was empty.");
    return JSON.parse(resultText) as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Interpretation Error:", error);
    throw new Error(error.message || "Could not analyze sign. Try a closer, clearer photo.");
  }
};