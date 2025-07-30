
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionConfig, TranscriptionResult } from './useTranscription';
import { portugueseProcessor, ProcessingOptions } from '@/utils/portugueseNLP';

export interface IntelligentTranscriptionConfig extends TranscriptionConfig {
  dialect: 'pt-PT' | 'pt-MZ';
  enableIntelligentFormatting: boolean;
  enableStructureDetection: boolean;
  enablePunctuationRestoration: boolean;
}

export const useIntelligentTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingQuality, setProcessingQuality] = useState(0);
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isWebSpeechSupported = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  const transcribeAudio = useCallback(async (
    audioFile: File,
    config: IntelligentTranscriptionConfig = {
      language: 'pt-PT',
      continuous: true,
      interimResults: true,
      dialect: 'pt-PT',
      enableIntelligentFormatting: true,
      enableStructureDetection: true,
      enablePunctuationRestoration: true
    }
  ): Promise<TranscriptionResult> => {
    if (!isWebSpeechSupported()) {
      throw new Error('Web Speech API não é suportada neste navegador');
    }

    setIsTranscribing(true);
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setProgress(0);
    setProcessingQuality(0);

    try {
      // Create audio element for playback
      const audioUrl = URL.createObjectURL(audioFile);
      const audio = new Audio(audioUrl);
      
      // Get audio duration
      const duration = await new Promise<number>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
        audio.addEventListener('error', () => {
          reject(new Error('Failed to load audio file'));
        });
        audio.load();
      });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure for Portuguese European
      recognition.continuous = config.continuous;
      recognition.interimResults = config.interimResults;
      recognition.lang = config.dialect;
      recognition.maxAlternatives = 3; // Get multiple alternatives for better processing

      let rawTranscript = '';
      let startTime = Date.now();

      toast({
        title: 'Transcrição inteligente iniciada',
        description: `Processamento em ${config.dialect} com formatação automática`,
      });

      return new Promise((resolve, reject) => {
        recognition.onstart = () => {
          console.log('Intelligent transcription started');
          audio.play().catch(console.error);
        };

        recognition.onresult = (event) => {
          let interim = '';
          let finalText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;
            
            if (result.isFinal) {
              finalText += text + ' ';
            } else {
              interim += text;
            }
          }

          if (finalText) {
            rawTranscript += finalText;
            
            // Apply intelligent processing in real-time
            const processingOptions: ProcessingOptions = {
              dialect: config.dialect,
              enablePunctuation: config.enablePunctuationRestoration,
              enableFormatting: config.enableIntelligentFormatting,
              enableStructure: config.enableStructureDetection
            };

            const processed = portugueseProcessor.processTranscript(rawTranscript, processingOptions);
            setTranscript(processed.text);
            setProcessingQuality(processed.confidence * 100);
          }

          setInterimTranscript(interim);

          // Update progress based on time elapsed
          const elapsed = (Date.now() - startTime) / 1000;
          const progressPercent = Math.min((elapsed / duration) * 100, 95);
          setProgress(progressPercent);
        };

        recognition.onerror = (event) => {
          console.error('Intelligent transcription error:', event.error);
          setError(`Erro na transcrição: ${event.error}`);
          setIsTranscribing(false);
          reject(new Error(`Erro na transcrição: ${event.error}`));
        };

        recognition.onend = () => {
          console.log('Intelligent transcription finished');
          setProgress(100);
          
          // Final processing
          const processingOptions: ProcessingOptions = {
            dialect: config.dialect,
            enablePunctuation: config.enablePunctuationRestoration,
            enableFormatting: config.enableIntelligentFormatting,
            enableStructure: config.enableStructureDetection
          };

          const finalProcessed = portugueseProcessor.processTranscript(rawTranscript, processingOptions);
          setTranscript(finalProcessed.text);
          setProcessingQuality(finalProcessed.confidence * 100);

          const wordCount = finalProcessed.text ? 
            finalProcessed.text.replace(/[#*"]/g, '').split(/\s+/).filter(word => word.length > 0).length : 0;

          const result: TranscriptionResult = {
            title: audioFile.name.split('.')[0],
            fileName: audioFile.name,
            fileSize: audioFile.size,
            language: config.dialect,
            status: 'completed',
            transcribedText: finalProcessed.text,
            accuracyScore: finalProcessed.confidence * 100,
            wordCount,
            durationSeconds: Math.floor(duration)
          };

          toast({
            title: 'Transcrição inteligente concluída',
            description: `${wordCount} palavras • ${finalProcessed.structure.paragraphs} parágrafos • ${finalProcessed.structure.headings} títulos`,
          });

          setIsTranscribing(false);
          URL.revokeObjectURL(audioUrl);
          resolve(result);
        };

        // Start recognition
        recognition.start();

        // Stop recognition when audio ends
        audio.onended = () => {
          recognition.stop();
        };

        audio.onerror = () => {
          recognition.stop();
          reject(new Error('Erro ao reproduzir áudio'));
        };
      });

    } catch (error) {
      console.error('Error during intelligent transcription:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setIsTranscribing(false);
      throw error;
    }
  }, [toast]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsTranscribing(false);
    setProgress(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setProgress(0);
    setProcessingQuality(0);
  }, []);

  return {
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    progress,
    processingQuality,
    transcribeAudio,
    stopTranscription,
    clearTranscript,
    isWebSpeechSupported,
  };
};
