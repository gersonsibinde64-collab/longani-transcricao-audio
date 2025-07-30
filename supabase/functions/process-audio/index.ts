
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileId, fileName, fileSize } = await req.json()
    
    console.log(`Processing audio file: ${fileName} (${fileSize} bytes)`)

    // Update status to processing
    await supabase
      .from('temp_transcriptions')
      .update({ status: 'processing' })
      .eq('id', fileId)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('temp-audio')
      .download(fileId)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      await supabase
        .from('temp_transcriptions')
        .update({ status: 'failed' })
        .eq('id', fileId)
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Process audio in chunks (simulated transcription for large files)
    const chunkSize = 1024 * 1024 * 5 // 5MB chunks
    const fileBuffer = await fileData.arrayBuffer()
    const totalChunks = Math.ceil(fileBuffer.byteLength / chunkSize)
    
    let transcribedText = ''
    
    // Process each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, fileBuffer.byteLength)
      const chunk = fileBuffer.slice(start, end)
      
      console.log(`Processing chunk ${i + 1}/${totalChunks} (${chunk.byteLength} bytes)`)
      
      // Simulate transcription processing (replace with actual transcription logic)
      const chunkDuration = Math.random() * 2000 + 1000 // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, chunkDuration))
      
      // Generate simulated transcribed text based on chunk
      const words = [
        'Este é um texto de exemplo',
        'processado pelo servidor',
        'utilizando chunks de áudio',
        'para otimizar a memória',
        'e melhorar o desempenho'
      ]
      transcribedText += words[Math.floor(Math.random() * words.length)] + ' '
    }

    // Calculate accuracy and word count
    const wordCount = transcribedText.trim().split(/\s+/).filter(word => word.length > 0).length
    const accuracyScore = Math.random() * 15 + 85 // 85-100%

    // Update status to completed
    await supabase
      .from('temp_transcriptions')
      .update({ status: 'completed' })
      .eq('id', fileId)

    // Clean up the file immediately after processing
    await supabase.storage
      .from('temp-audio')
      .remove([fileId])

    console.log(`Transcription completed for ${fileName}: ${wordCount} words`)

    return new Response(
      JSON.stringify({
        success: true,
        transcribedText: transcribedText.trim(),
        wordCount,
        accuracyScore: parseFloat(accuracyScore.toFixed(2)),
        durationSeconds: Math.floor(fileSize / (16000 * 2)) // Estimate duration
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error processing audio:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
