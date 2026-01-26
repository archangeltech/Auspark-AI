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

  const permitContext = `
    USER PERMITS (EXEMPTIONS):
    - Disability/MPS Permit: ${profile.hasDisabilityPermit}
    - Resident Permit: ${profile.hasResidentPermit} (Area: ${profile.residentArea || 'N/A'})
    - Loading Zone Permit: ${profile.hasLoadingZonePermit}
    - Business Permit: ${profile.hasBusinessPermit}
  `;

  const prompt = `
    You are an expert Australian Parking Sign Interpreter. Analyze the provided image of parking sign(s).
    
    CONTEXT:
    - Current Time: ${currentTime}
    - Current Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    AUSTRALIAN RULES KNOWLEDGE (CRITICAL):
    1. DISABILITY (MPS): 
       - Sign P 5 mins -> MPS gets 30 mins.
       - Sign P 30 mins -> MPS gets 2 hours.
       - Sign P > 30 mins -> MPS gets unlimited time.
       - MPS holders can park in dedicated "Disabled Only" (Wheelchair logo) spots.
    2. RESIDENT PERMITS:
       - Exempt from time limits or "Permit Holders Only" IF the sign matches the resident area.
    3. LOADING ZONES (CRITICAL):
       - Default: For goods vehicles/couriers only.
       - SPECIAL EXEMPTION: If the user has a "Loading Zone Permit", they are PERMITTED to park in a Loading Zone for the duration specified (usually 15-30 mins) even if their vehicle is NOT a goods vehicle. 
       - If 'hasLoadingZonePermit' is true, interpret "Loading Zone" signs as ALLOWED for the user.
    4. CLEARWAYS/NO STOPPING:
       - NO PERMITS (including MPS/Loading) allow parking here. Strict prohibition.

    TASK:
    - Determine 'canParkNow' (Boolean).
    - If 'canParkNow' is true because of a specific permit (Disability, Resident, Loading Zone), set 'permitApplied' to that permit's name. 
    - If NO permit was used or helped, set 'permitApplied' to null (literal null, not the string "null").
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
            status: { 
              type: Type.STRING, 
              enum: ["ALLOWED", "FORBIDDEN", "RESTRICTED", "UNKNOWN"],
              description: "The general status of the parking zone."
            },
            canParkNow: { type: Type.BOOLEAN },
            summary: { type: Type.STRING, description: "Short 3-5 word verdict." },
            explanation: { type: Type.STRING, description: "Detailed explanation of permit usage or restriction reasons." },
            rules: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Rules found on the sign." },
            permitRequired: { type: Type.BOOLEAN },
            permitApplied: { type: Type.STRING, nullable: true, description: "The name of the user permit that allowed this, or null if none used." },
            nextStatusChange: { type: Type.STRING, description: "When the current rule expires." },
            timeRemainingMinutes: { type: Type.NUMBER, description: "Minutes allowed." }
          },
          required: ["status", "canParkNow", "summary", "explanation", "rules", "permitRequired"]
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error("Empty AI response.");
    const parsed = JSON.parse(resultText);
    
    // Ensure permitApplied isn't the literal string "null"
    if (parsed.permitApplied === "null") {
      parsed.permitApplied = null;
    }
    
    return parsed as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};