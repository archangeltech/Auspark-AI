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
    Before interpreting, check for failure scenarios. If one is found, set code to the appropriate value (BLURRY, NO_SIGN, MULTIPLE_SIGNS, or AMBIGUOUS) and provide a helpful message and suggestion.
    1. BLURRY: The image is unreadable, out of focus, or obscured by glare.
       Message: "We can't read the text in this photo."
       Suggestion: "Try holding the camera steady and wait for it to focus."
    2. NO_SIGN: There is no Australian parking sign visible in the image.
       Message: "This doesn't look like a parking sign."
       Suggestion: "Please ensure the sign is fully visible within the frame."
    3. MULTIPLE_SIGNS: Multiple different sign poles are in the image, causing confusion.
       Message: "There are too many signs in one photo."
       Suggestion: "Try scanning just one pole at a time for better accuracy."
    4. AMBIGUOUS: Conflicting rules or obscured arrows make it unsafe to guess.
       Message: "The parking rules here are too complex to read clearly."
       Suggestion: "Try taking a closer photo of the specific sign you're looking at."

    TASK 2: INTERPRET RULES (If code is SUCCESS)
    If the image is clear, detect Arrows (Left/Right) and apply rules:
    - Current Time: ${currentTime}
    - Current Day: ${userDay}
    - ${locationContext}
    ${permitContext}

    LANGUAGE STYLE:
    Use natural, clear, non-technical English in 'summary' and 'explanation'.
    - Convert "1P", "2P", "1/2P" into "1 hour", "2 hours", "30 minutes".
    - Convert "Metered", "Meter", or "Ticket" into "paid parking".
    - Convert "No Standing" into "No stopping or waiting".

    OUTPUT: Return JSON with errorInfo and results.
  `;

  const MAX_RETRIES = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Fix: Creating a new GoogleGenAI instance right before the call per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Fix: Upgraded to gemini-3-pro-preview for complex reasoning task
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

      // Fix: Directly accessing .text property as per GenerateContentResponse guidelines
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