
import { useState, useCallback } from 'react';
import { useTranscription, TranscriptionResult, TranscriptionConfig } from './useTranscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_BROWSER_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for browser processing

export const useHybridTranscription = () => {
  const [isProcessingOnServer, setIsProcessingOnServer] = useState(false);
  const [serverProgress, setServerProgress] = useState(0);
  const browserTranscription = useTranscription();
  const { toast } = useToast();

  const detectMemoryCapabilities = useCallback(() => {
    // Check available memory (if supported by browser)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
      return availableMemory > MAX_BROWSER_FILE_SIZE * 2; // Need 2x file size for processing
    }
    return true; // Assume capability if we can't detect
  }, []);

  const shouldUseServerProcessing = useCallback((file: File) => {
    const hasMemoryCapability = detectMemoryCapabilities();
    const isLargeFile = file.size > MAX_BROWSER_FILE_SIZE;
    
    console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Memory capable: ${hasMemoryCapability}`);
    console.log(`Should use server: ${isLargeFile || !hasMemoryCapability}`);
    
    return isLargeFile || !hasMemoryCapability;
  }, [detectMemoryCapabilities]);

  const processOnServer = useCallback(async (
    file: File,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> => {
    setIsProcessingOnServer(true);
    setServerProgress(0);

    try {
      // Create temporary record
      const { data: tempRecord, error: insertError } = await supabase
        .from('temp_transcriptions')
        .insert({
          file_name: file.name,
          file_size: file.size,
          status: 'processing'
        })
        .select()
        .single();

      if (insertError || !tempRecord) {
        throw new Error('Failed to create processing record');
      }

      toast({
        title: 'Processamento no servidor',
        description: 'Arquivo grande detectado. Processando no servidor...',
      });

      setServerProgress(10);

      // Upload file to temporary storage
      const { error: uploadError } = await supabase.storage
        .from('temp-audio')
        .upload(tempRecord.id, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error('Failed to upload file for processing');
      }

      setServerProgress(30);

      // Call edge function for processing
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          fileId: tempRecord.id,
          fileName: file.name,
          fileSize: file.size,
        },
      });

      if (error) {
        throw new Error(`Server processing failed: ${error.message}`);
      }

      setServerProgress(90);

      // Clean up temporary record
      await supabase
        .from('temp_transcriptions')
        .delete()
        .eq('id', tempRecord.id);

      setServerProgress(100);

      const result: TranscriptionResult = {
        title: file.name.split('.')[0],
        fileName: file.name,
        fileSize: file.size,
        language: config.language,
        status: 'completed',
        transcribedText: data.transcribedText,
        accuracyScore: data.accuracyScore,
        wordCount: data.wordCount,
        durationSeconds: data.durationSeconds
      };

      toast({
        title: 'Processamento concluído',
        description: `Arquivo processado no servidor: ${data.wordCount} palavras transcritas`,
      });

      return result;

    } catch (error) {
      console.error('Server processing error:', error);
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Erro no servidor',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsProcessingOnServer(false);
      setServerProgress(0);
    }
  }, [toast]);

  const transcribeAudio = useCallback(async (
    file: File,
    config: TranscriptionConfig = { language: 'pt-BR', continuous: true, interimResults: true }
  ): Promise<TranscriptionResult> => {
    
    if (shouldUseServerProcessing(file)) {
      return processOnServer(file, config);
    } else {
      return browserTranscription.transcribeAudio(file, config);
    }
  }, [shouldUseServerProcessing, processOnServer, browserTranscription]);

  return {
    // Expose all browser transcription properties
    ...browserTranscription,
    // Override with hybrid functionality
    transcribeAudio,
    // Additional server processing states
    isProcessingOnServer,
    serverProgress,
    // Combined loading state
    isTranscribing: browserTranscription.isTranscribing || isProcessingOnServer,
    // Combined progress
    progress: isProcessingOnServer ? serverProgress : browserTranscription.progress,
  };
};
