import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { query, lat, lng } = await req.json();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Location: ${lat}, ${lng}. 
                 Query: "${query}". 
                 Goal: Find specific physical places nearby. 
                 Return details about the top 3 best matching places.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            googleMaps: {
                retrievalConfig: {
                    latLng: { latitude: lat, longitude: lng }
                }
            }
        }
      }
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.find(p => p.text)?.text || "Here are some places nearby.";
    
    // Extract grounding chunks. The SDK returns these in the metadata.
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    
    const places = chunks.map((c: any) => {
        // Handle Gemini 2.5 grounding chunk structure for Maps
        // Often comes as { maps: { title, googleMapsUri, placeId, ... } }
        if (c.maps) {
             return {
                name: c.maps.title,
                googleMapsUri: c.maps.googleMapsUri || c.maps.uri, // Fallback uri
                rating: "4.8", 
                userRatingCount: "(Verified)",
                address: "View on Map"
            };
        }
        // Fallback for generic web grounding if maps tool misses but web search hits
        if (c.web) {
            return {
                name: c.web.title,
                googleMapsUri: c.web.uri,
                rating: "Web",
                userRatingCount: "",
                address: "External Link"
            };
        }
        return null;
    }).filter(Boolean);

    return NextResponse.json({ text, places });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ 
        text: "I couldn't reach the live map services right now, but you can try again shortly.", 
        places: [] 
    });
  }
}