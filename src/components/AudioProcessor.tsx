import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Mic, Square, Play, Pause, Trash2, FileText, Server, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHybridTranscription } from '@/hooks/useHybridTranscription';
import { TranscriptionResult } from '@/hooks/useTranscription';

interface AudioProcessorProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
}

const MAX_BROWSER_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const AudioProcessor = ({ onTranscriptionComplete }: AudioProcessorProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processingMethod, setProcessingMethod] = useState<'browser' | 'server' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const {
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    progress,
    transcribeAudio,
    stopTranscription,
    clearTranscript,
    isWebSpeechSupported,
    isProcessingOnServer,
    serverProgress
  } = useHybridTranscription();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRecording) {
      intervalId = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRecording]);

  const determineProcessingMethod = useCallback((file: File) => {
    const isLarge = file.size > MAX_BROWSER_FILE_SIZE;
    return isLarge ? 'server' : 'browser';
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo de áudio válido.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const method = determineProcessingMethod(file);
      setProcessingMethod(method);
      
      // Create audio URL for playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      toast({
        title: 'Arquivo selecionado',
        description: `${file.name} (${fileSizeMB}MB) - ${method === 'server' ? 'Processamento no servidor' : 'Processamento local'}`,
      });
    }
  }, [toast, determineProcessingMethod]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setSelectedFile(file);
        const method = determineProcessingMethod(file);
        setProcessingMethod(method);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: 'Gravação iniciada',
        description: 'Fale no microfone para gravar seu áudio.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Erro na gravação',
        description: 'Não foi possível acessar o microfone.',
        variant: 'destructive',
      });
    }
  }, [toast, determineProcessingMethod]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      toast({
        title: 'Gravação finalizada',
        description: 'Áudio gravado com sucesso!',
      });
    }
  }, [isRecording, toast]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [audioUrl, isPlaying]);

  const processAudio = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo de áudio ou grave um novo.',
        variant: 'destructive',
      });
      return;
    }

    if (!isWebSpeechSupported() && processingMethod === 'browser') {
      toast({
        title: 'Recurso não suportado',
        description: 'Seu navegador não suporta reconhecimento de fala. Processando no servidor...',
      });
      setProcessingMethod('server');
    }

    try {
      const result = await transcribeAudio(selectedFile, {
        language: 'pt-BR',
        continuous: true,
        interimResults: true
      });

      onTranscriptionComplete?.(result);

      cleanup();

      toast({
        title: 'Transcrição concluída',
        description: 'Transcrição finalizada com sucesso!',
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Erro na transcrição',
        description: error instanceof Error ? error.message : 'Erro desconhecido na transcrição',
        variant: 'destructive',
      });
    }
  }, [selectedFile, transcribeAudio, onTranscriptionComplete, toast, isWebSpeechSupported, processingMethod]);

  const cleanup = useCallback(() => {
    setSelectedFile(null);
    setProcessingMethod(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    clearTranscript();
  }, [audioUrl, clearTranscript]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Selecionar Arquivo de Áudio</h3>
        <p className="text-gray-500 mb-4">
          Suporte para MP3, WAV, M4A e outros formatos
        </p>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isTranscribing}
          className="mr-4"
        >
          Escolher Arquivo
        </Button>

        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          variant={isRecording ? "destructive" : "secondary"}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Parar Gravação ({formatTime(recordingTime)})
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Gravar Áudio
            </>
          )}
        </Button>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {processingMethod && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-white rounded text-sm">
                  {processingMethod === 'server' ? (
                    <>
                      <Server className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Servidor</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600">Local</span>
                    </>
                  )}
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={togglePlayback}
                disabled={isTranscribing}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={cleanup}
                disabled={isTranscribing}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={processAudio}
            disabled={isTranscribing || !selectedFile}
            className="w-full"
          >
            {isTranscribing ? 'Processando...' : 'Iniciar Transcrição'}
          </Button>
        </div>
      )}

      {/* Progress Section */}
      {isTranscribing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {isProcessingOnServer ? 'Processando no servidor...' : 'Transcrevendo...'}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          {isProcessingOnServer && (
            <p className="text-sm text-gray-600 text-center">
              Arquivo grande sendo processado no servidor para melhor performance
            </p>
          )}
        </div>
      )}

      {/* Transcription Results */}
      {(transcript || interimTranscript) && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-3">Resultado da Transcrição:</h3>
          <div className="space-y-2">
            {transcript && (
              <p className="text-gray-900 leading-relaxed">{transcript}</p>
            )}
            {interimTranscript && (
              <p className="text-gray-500 italic leading-relaxed">
                {interimTranscript}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
