
import { useState, useCallback } from 'react';
import { useTranscription, TranscriptionResult, TranscriptionConfig } from './useTranscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useIntelligentTranscription = () => {
  const [isProcessingWithAI, setIsProcessingWithAI] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const browserTranscription = useTranscription();
  const { toast } = useToast();

  const processWithAI = useCallback(async (transcript: string): Promise<string> => {
    setIsProcessingWithAI(true);
    setAiProgress(0);

    try {
      console.log('Starting AI processing for transcript:', transcript.substring(0, 100) + '...');
      
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
        console.error('AI processing error:', error);
        throw new Error(`Erro no processamento IA: ${error.message}`);
      }

      setAiProgress(90);

      console.log('AI processing response:', data);

      if (!data?.structuredText) {
        throw new Error('Resposta inválida do processamento IA');
      }

      if (!data.aiProcessed) {
        console.warn('AI processing may not have completed successfully');
      }

      setAiProgress(100);

      toast({
        title: 'Processamento IA concluído',
        description: `Texto estruturado com sucesso (${data.aiProcessed ? 'com IA' : 'básico'})`,
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
      console.log('Starting intelligent transcription for:', file.name);
      
      // First, perform the REAL transcription using Web Speech API
      const basicResult = await browserTranscription.transcribeAudio(file, config);
      
      console.log('Basic transcription completed:', basicResult.transcribedText);
      
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
            description: 'Processamento IA falhou, mas transcrição real está disponível',
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
