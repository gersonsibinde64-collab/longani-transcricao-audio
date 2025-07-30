
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LocalTranscriptionService } from '@/utils/localTranscriptionService';

export interface TranscriptionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export interface TranscriptionResult {
  title: string;
  fileName: string;
  fileSize: number;
  language: string;
  status: 'processing' | 'completed' | 'failed';
  transcribedText?: string;
  accuracyScore?: number;
  wordCount?: number;
  durationSeconds?: number;
  errorMessage?: string;
}

export const useTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { toast } = useToast();

  const isWebSpeechSupported = useCallback(() => {
    // Always return true since we're using local Whisper
    return true;
  }, []);

  const transcribeAudio = useCallback(async (
    audioFile: File, 
    config: TranscriptionConfig = { language: 'pt-PT', continuous: true, interimResults: true }
  ): Promise<TranscriptionResult> => {
    
    setIsTranscribing(true);
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setProgress(0);

    try {
      console.log('Starting LOCAL Whisper transcription for:', audioFile.name);
      
      // Show model loading status
      const result = await LocalTranscriptionService.transcribeAudio(
        audioFile,
        config.language,
        (progressInfo) => {
          console.log('Progress update:', progressInfo);
          
          if (progressInfo.status === 'loading') {
            setIsModelLoading(true);
            setProgress(progressInfo.progress);
            
            if (progressInfo.progress === 10) {
              toast({
                title: 'Primeira utilização',
                description: 'A descarregar modelo Whisper (~150MB)...',
              });
            }
          } else if (progressInfo.status === 'transcribing') {
            setIsModelLoading(false);
            setProgress(progressInfo.progress);
            
            // Update interim transcript for real-time feedback
            if (progressInfo.progress > 40) {
              setInterimTranscript('A processar com Whisper...');
            }
          } else if (progressInfo.status === 'completed') {
            setProgress(100);
            setInterimTranscript('');
          } else if (progressInfo.status === 'error') {
            setError(progressInfo.message);
          }
        }
      );

      console.log('Raw transcription result:', result);

      // Update final transcript
      setTranscript(result.text);

      const transcriptionResult: TranscriptionResult = {
        title: audioFile.name.split('.')[0],
        fileName: audioFile.name,
        fileSize: audioFile.size,
        language: config.language,
        status: 'completed',
        transcribedText: result.text,
        accuracyScore: result.accuracyScore,
        wordCount: result.wordCount,
        durationSeconds: result.durationSeconds
      };

      toast({
        title: 'Transcrição Whisper concluída',
        description: `${result.wordCount} palavras transcritas com ${result.accuracyScore.toFixed(1)}% de precisão`,
      });

      console.log('LOCAL transcription completed successfully:', transcriptionResult);
      return transcriptionResult;

    } catch (error) {
      console.error('Local transcription error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro na transcrição local';
      
      setError(errorMsg);
      
      toast({
        title: 'Erro na transcrição',
        description: errorMsg,
        variant: 'destructive',
      });
      
      const failedResult: TranscriptionResult = {
        title: audioFile.name.split('.')[0],
        fileName: audioFile.name,
        fileSize: audioFile.size,
        language: config.language,
        status: 'failed',
        errorMessage: errorMsg
      };
      
      return failedResult;
    } finally {
      setIsTranscribing(false);
      setIsModelLoading(false);
      setProgress(0);
    }
  }, [toast]);

  const stopTranscription = useCallback(() => {
    setIsTranscribing(false);
    setIsModelLoading(false);
    setProgress(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setProgress(0);
  }, []);

  return {
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    progress,
    isModelLoading,
    transcribeAudio,
    stopTranscription,
    clearTranscript,
    isWebSpeechSupported
  };
};
