
-- Create temporary transcription table for processing metadata only
CREATE TABLE IF NOT EXISTS public.temp_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 hour')
);

-- Enable RLS but allow all operations (temporary data only)
ALTER TABLE public.temp_transcriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations on temporary data (no user restrictions since it's ephemeral)
CREATE POLICY "Allow all operations on temp transcriptions" 
  ON public.temp_transcriptions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to auto-delete expired records
CREATE OR REPLACE FUNCTION public.cleanup_expired_transcriptions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.temp_transcriptions 
  WHERE expires_at < now();
END;
$$;

-- Create trigger to automatically cleanup expired records
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cleanup_expired_transcriptions();
  RETURN NEW;
END;
$$;

-- Create trigger that runs cleanup on each insert
CREATE OR REPLACE TRIGGER cleanup_on_insert
  AFTER INSERT ON public.temp_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_expired();

-- Create storage bucket for temporary audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-audio', 'temp-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy allowing all operations (temporary files only)
CREATE POLICY "Allow all operations on temp audio files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'temp-audio')
  WITH CHECK (bucket_id = 'temp-audio');
