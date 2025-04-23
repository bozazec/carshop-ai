import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have a shared CORS setup

// Get the API key from environment variables (set via Supabase secrets)
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

console.log('Google Vision OCR function initializing...');
if (!GOOGLE_API_KEY) {
  console.error('CRITICAL: GOOGLE_CLOUD_API_KEY environment variable not set!');
  // Optionally, throw an error during initialization if you prefer the function
  // not to start at all without the key.
  // throw new Error("GOOGLE_CLOUD_API_KEY environment variable not set!");
}

serve(async (req: Request) => {
  // --- Preflight CORS handling ---
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Ensure API Key is available ---
  // Check again in case initialization logic changes or env vars become unavailable
  if (!GOOGLE_API_KEY) {
    console.error('Google API Key is missing.');
    return new Response(JSON.stringify({ error: 'Server configuration error: API key missing.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // --- Basic Request Validation ---
  if (req.method !== 'POST') {
     console.error(`Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let imageBase64: string | undefined;
  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.error('Missing or invalid imageBase64 in request body');
      return new Response(JSON.stringify({ error: 'Missing or invalid imageBase64 field in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Optional: Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    if (imageBase64.startsWith('data:')) {
        imageBase64 = imageBase64.split(',')[1];
    }

  } catch (error) {
    console.error('Error parsing request JSON:', error);
    return new Response(JSON.stringify({ error: `Invalid request body: ${error.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('Received image data, calling Google Vision API...');

  // --- Prepare Google Vision API Request ---
  const requestPayload = {
    requests: [
      {
        image: {
          content: imageBase64, // Send the base64 string directly
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION', // Best for dense text / documents
            // Use 'TEXT_DETECTION' for sparser text
            // maxResults: 50, // Optional: limit results
          },
          // Add other features if needed, e.g.:
          // { type: 'FACE_DETECTION' },
          // { type: 'OBJECT_LOCALIZATION' },
        ],
        // Optional: Add image context, like language hints
        // imageContext: {
        //   languageHints: ["en", "sr"] // Example: English and Serbian
        // }
      },
    ],
  };

  // --- Call Google Vision API ---
  try {
    const visionResponse = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log(`Google Vision API response status: ${visionResponse.status}`);

    if (!visionResponse.ok) {
      const errorBody = await visionResponse.text(); // Read error as text first
      console.error('Google Vision API error:', errorBody);
      // Attempt to parse as JSON for more structured error info, fallback to text
      let errorJson = { message: errorBody };
      try {
          errorJson = JSON.parse(errorBody);
      } catch (_) { /* ignore parsing error */ }

      return new Response(JSON.stringify({
          error: 'Google Vision API request failed',
          status: visionResponse.status,
          details: errorJson
        }), {
        status: visionResponse.status, // Forward Google's status code
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const visionData = await visionResponse.json();
    console.log('Successfully received data from Google Vision API.');

    // --- Return Success Response ---
    // You might want to process/simplify visionData before returning
    // For example, just extracting the full text:
    // const fullText = visionData?.responses?.[0]?.fullTextAnnotation?.text;
    // return new Response(JSON.stringify({ text: fullText ?? '' }), { ... });

    return new Response(JSON.stringify(visionData), { // Return the full response for now
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calling Google Vision API or processing response:', error);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// --- Optional: Shared CORS setup (supabase/functions/_shared/cors.ts) ---
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific frontend domain: 'https://app.bilet.rs'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
};
*/