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
    
    CRITICAL INSTRUCTION: Detect Arrows.
    - If the sign has arrows pointing in different directions (e.g. Left is 1 hour, Right is No Stopping), you MUST return TWO results in the 'results' array: one for 'left' and one for 'right'.
    - If there are no specific arrows, return a single result with direction 'general'.

    CONTEXT:
    - Current Time: ${currentTime}
    - Current Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    TERMINOLOGY PREFERENCE (CRITICAL):
    - Do NOT use the "P" shorthand in the output (e.g., avoid "1P", "2P", "1/2P").
    - ALWAYS use full words: "1 hour", "2 hours", "30 minutes" instead.

    AUSTRALIAN RULES KNOWLEDGE (REFINED):
    1. DISABILITY (MPS) PERMIT RULES:
       - Inside signed hours:
         * Sign = 1 hour -> User gets 2 hours.
         * Sign = 30 mins -> User gets 2 hours.
         * Sign < 30 mins -> User gets 30 minutes.
         * Sign > 1 hour -> User often gets Unlimited (NSW) or capped extension (VIC/QLD).
       - Outside signed hours (e.g. if sign is 9:30am-7:30pm and it is now 8pm):
         * In many Australian council zones (like Melbourne/Sydney), MPS holders are capped at 4 hours total in otherwise unrestricted zones.
    2. RESIDENT PERMITS: Exempt from time limits if area matches.
    3. LOADING ZONES: Allowed for user if 'hasLoadingZonePermit' is true.
    4. CLEARWAYS / NO STOPPING: No permits allowed.

    TASK:
    - Return a JSON object with a 'results' array.
    - Calculate 'timeRemainingMinutes' accurately including permit extensions.
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
                  nextStatusChange: { type: Type.STRING },
                  timeRemainingMinutes: { type: Type.NUMBER }
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
    const parsed = JSON.parse(resultText);
    
    if (!parsed.results || parsed.results.length === 0) {
      throw new Error("AI failed to interpret directional results.");
    }
    
    return parsed as ParkingInterpretation;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};