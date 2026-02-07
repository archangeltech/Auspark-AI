
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
  // Manual API key check removed as process.env.API_KEY is assumed to be pre-configured.

  // Ensure clean base64 data for the API
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const locationContext = location 
    ? `Location: Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}.`
    : "Location not provided.";

  const permitContext = `
    USER PERMITS & VEHICLE TYPE (EXEMPTIONS):
    - Disability Permit (MPS/ADP): ${profile.hasDisabilityPermit}
    - Resident Permit: ${profile.hasResidentPermit} (Area: ${profile.residentArea || 'N/A'})
    - Loading Vehicle (Truck/Commercial): ${profile.hasLoadingVehicle}
    - Horse carriage: ${profile.hasHorseCarriage}
    - Bus Permit / Authorized Vehicle: ${profile.hasBusPermit}
    - Taxi: ${profile.hasTaxiPermit}
  `;

  const prompt = `
    Analyze the provided image of Australian parking sign(s).
    
    TASK 1: VALIDATE IMAGE QUALITY & CONTENT
    If you cannot read the sign clearly, set the code below and explain why in SIMPLE ENGLISH.
    1. BLURRY: The photo is too blurry or has too much glare.
    2. NO_SIGN: I can't see an Australian parking sign in this photo.
    3. MULTIPLE_SIGNS: There are too many different sign poles. Try to scan just one.
    4. AMBIGUOUS: The signs are confusing or blocked.

    TASK 2: INTERPRET RULES (If code is SUCCESS)
    Current Time: ${currentTime}
    Current Day: ${userDay}
    ${locationContext}
    ${permitContext}

    LANGUAGE STYLE: Use very simple English. Avoid technical jargon. Instead of "1P", say "1 hour". Instead of "Metered", say "Paid parking".
    OUTPUT: Return JSON with errorInfo and results.
  `;

  const MAX_RETRIES = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create a fresh instance for each attempt to ensure the latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
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
                    permitApplied: { type: Type.STRING },
                    nextStatusChange: { type: Type.STRING },
                    timeRemainingMinutes: { type: Type.NUMBER }
                  },
                  required: ["direction", "status", "canParkNow", "summary", "explanation", "rules", "permitRequired"]
                }
              }
            },
            required: ["errorInfo", "results"]
          }
        }
      });

      // Extract text output using the correct property access
      const resultText = response.text?.trim();
      if (!resultText) throw new Error("The AI didn't give an answer. Please try again.");
      return JSON.parse(resultText) as ParkingInterpretation;

    } catch (error: any) {
      lastError = error;
      const errorStr = String(error).toLowerCase();
      
      const isNetworkError = error instanceof TypeError || errorStr.includes('fetch') || errorStr.includes('network');
      const isOverloaded = errorStr.includes('503') || errorStr.includes('overloaded') || errorStr.includes('429');

      if ((isNetworkError || isOverloaded) && attempt < MAX_RETRIES) {
        const backoffTime = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
        console.warn(`Retrying... (Attempt ${attempt + 1})`);
        await sleep(backoffTime);
        continue;
      }
      
      if (isNetworkError) {
        throw new Error("Internet Lost. We couldn't talk to our servers. Please check your signal or Wi-Fi.");
      }

      if (isOverloaded) {
        throw new Error("AI is Busy. Too many people are scanning signs right now. Please wait a moment and try again.");
      }
      
      throw error;
    }
  }

  throw lastError || new Error("Something went wrong. Please try scanning the sign again.");
};
