
import { useState, useCallback } from 'react';
import { useTranscription, TranscriptionResult, TranscriptionConfig } from './useTranscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_BROWSER_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for browser processing

export const useIntelligentTranscription = () => {
  const [isProcessingWithAI, setIsProcessingWithAI] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const browserTranscription = useTranscription();
  const { toast } = useToast();

  const processWithAI = useCallback(async (transcript: string): Promise<string> => {
    setIsProcessingWithAI(true);
    setAiProgress(0);

    try {
      toast({
        title: 'Processamento com IA',
        description: 'Estruturando texto com inteligência artificial...',
      });

      setAiProgress(30);

      // Call the Supabase edge function for AI processing
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { transcript }
      });

      if (error) {
        throw new Error(`Erro no processamento IA: ${error.message}`);
      }

      setAiProgress(90);

      if (!data?.structuredText) {
        throw new Error('Resposta inválida do processamento IA');
      }

      setAiProgress(100);

      toast({
        title: 'Processamento IA concluído',
        description: 'Texto estruturado com sucesso pela inteligência artificial',
      });

      return data.structuredText;

    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'Erro no processamento IA',
        description: error instanceof Error ? error.message : 'Erro no servidor de IA',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsProcessingWithAI(false);
      setAiProgress(0);
    }
  }, [toast]);

  const transcribeAudio = useCallback(async (
    file: File,
    config: TranscriptionConfig = { language: 'pt-PT', continuous: true, interimResults: true }
  ): Promise<TranscriptionResult> => {
    
    try {
      // First, perform the basic transcription
      const basicResult = await browserTranscription.transcribeAudio(file, config);
      
      // If we have transcribed text, process it with AI for structuring
      if (basicResult.transcribedText && basicResult.transcribedText.trim()) {
        try {
          const structuredText = await processWithAI(basicResult.transcribedText);
          
          // Return enhanced result with AI-structured text
          return {
            ...basicResult,
            transcribedText: structuredText,
            status: 'completed'
          };
        } catch (aiError) {
          console.error('AI processing failed, returning basic transcription:', aiError);
          
          // If AI processing fails, return the basic transcription
          toast({
            title: 'Usando transcrição básica',
            description: 'Processamento IA falhou, mas transcrição básica está disponível',
          });
          
          return basicResult;
        }
      }
      
      return basicResult;
      
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }, [browserTranscription, processWithAI, toast]);

  const clearTranscript = useCallback(() => {
    browserTranscription.clearTranscript();
    setIsProcessingWithAI(false);
    setAiProgress(0);
  }, [browserTranscription]);

  return {
    // Expose all browser transcription properties
    ...browserTranscription,
    // Override with AI-enhanced functionality
    transcribeAudio,
    clearTranscript,
    // Additional AI processing states
    isProcessingWithAI,
    aiProgress,
    // Combined loading state
    isTranscribing: browserTranscription.isTranscribing || isProcessingWithAI,
    // Combined progress - show AI progress when AI is processing
    progress: isProcessingWithAI ? aiProgress : browserTranscription.progress,
    // Processing quality indicator
    processingQuality: isProcessingWithAI ? 95 : 85,
  };
};
