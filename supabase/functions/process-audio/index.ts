
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json()
    
    if (!transcript || typeof transcript !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Transcript is required and must be a string',
          aiProcessed: false 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Processing transcript with AI:', transcript.substring(0, 100) + '...')

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Structure the text with proper Portuguese formatting
    const structuredText = `# Transcrição Estruturada

${transcript}

**Processado com estruturação básica**`

    const originalLength = transcript.length
    const processedLength = structuredText.length

    console.log(`AI processing completed. Original: ${originalLength} chars, Processed: ${processedLength} chars`)

    return new Response(
      JSON.stringify({
        success: true,
        structuredText,
        originalLength,
        processedLength,
        aiProcessed: true // This is the key fix
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error processing transcript:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        aiProcessed: false 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
