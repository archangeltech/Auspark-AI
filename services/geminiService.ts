import { GoogleGenAI, Type } from "@google/genai";
import { ParkingInterpretation, UserProfile } from "../types.ts";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      "API Key is missing. For mobile apps (Android/iOS), the API_KEY must be set as an environment variable on your computer when running 'npm run build' so it can be baked into the app."
    );
  }

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
    
    TASK 1: VALIDATE IMAGE QUALITY & CONTENT
    Check for the following common failure scenarios:
    1. Poor quality: Is the text unreadable or sign extremely blurry? (Code: BLURRY)
    2. No sign: Is there no parking sign in the frame? (Code: NO_SIGN)
    3. Multiple signs: Are there more than 2 distinct physical poles or a chaotic array of signs? (Code: MULTIPLE_SIGNS)
    4. Ambiguity: Are the rules conflicting or the image so cluttered it's unsafe to guess? (Code: AMBIGUOUS)

    TASK 2: INTERPRET RULES
    If the image is clear, detect Arrows (Left/Right) and apply rules:
    - Current Time: ${currentTime}
    - Current Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    LANGUAGE STYLE (IMPORTANT):
    Use natural, clear, non-technical English in 'summary' and 'explanation'.
    - Convert "1P", "2P", "1/2P" into "1 hour", "2 hours", "30 minutes".
    - Convert "Metered", "Meter", or "Ticket" into "paid parking".
    - Convert "No Standing" into "No stopping or waiting".
    - Example: Instead of "1P Metered Parking", use "1 hour paid parking".
    - Example: Instead of "1/2P Resident Permit Area 5", use "30 minute parking (Free for Area 5 residents)".

    AUSTRALIAN RULES:
    1. Disability Permits: 1P -> 2H, 1/2P -> 2H in green-sign zones.
    2. Resident Permits: Exempt from Permit Zone and time limits in matching Area.
    3. Loading Zones: Require commercial/LZ permits.

    OUTPUT: Return JSON with errorInfo and results.
  `;

  const MAX_RETRIES = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Fix: Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
              errorInfo: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, enum: ["BLURRY", "NO_SIGN", "MULTIPLE_SIGNS", "AMBIGUOUS", "SUCCESS"] },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["code", "message", "suggestion"]
              },
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
            required: ["errorInfo", "results"]
          }
        }
      });

      // Fix: Access response.text property directly as per guidelines
      const resultText = response.text?.trim();
      if (!resultText) throw new Error("Empty AI response.");
      return JSON.parse(resultText) as ParkingInterpretation;

    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();
      const isOverloaded = errorStr.includes('503') || 
                           errorStr.includes('overloaded') || 
                           errorStr.includes('unavailable') ||
                           errorStr.includes('429') || 
                           error.message?.toLowerCase().includes('overloaded');

      if (isOverloaded && attempt < MAX_RETRIES) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.warn(`Gemini overloaded (Attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying in ${backoffTime}ms...`);
        await sleep(backoffTime);
        continue;
      }
      
      console.error("Gemini Final Error:", error);
      throw error;
    }
  }

  throw lastError || new Error("Unknown error during sign analysis.");
};