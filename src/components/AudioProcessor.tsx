
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileAudio, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle,
  Loader2 
} from 'lucide-react';
import { useTranscription } from '@/hooks/useTranscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const AudioProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const {
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    progress,
    transcribeAudio,
    stopTranscription,
    isWebSpeechSupported
  } = useTranscription();
  
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const supportedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
      if (!supportedTypes.includes(file.type)) {
        toast({
          title: 'Formato não suportado',
          description: 'Por favor, selecione um arquivo de áudio (MP3, WAV, M4A, OGG, WebM).',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 100MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const simulateUploadProgress = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
    };
  }, []);

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    if (!isWebSpeechSupported()) {
      toast({
        title: 'Navegador não suportado',
        description: 'Web Speech API não é suportada neste navegador.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const cleanup = simulateUploadProgress();
      
      // Start transcription
      const result = await transcribeAudio(selectedFile, {
        language: 'pt-BR',
        continuous: true,
        interimResults: true
      });

      cleanup();

      // Navigate to the transcription details page
      if (result.id) {
        toast({
          title: 'Transcrição concluída',
          description: 'Redirecionando para visualizar o resultado...',
        });
        setTimeout(() => {
          navigate(`/transcricoes/${result.id}`);
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Falha ao processar o arquivo de áudio.',
        variant: 'destructive',
      });
    }
  };

  const handleStop = () => {
    stopTranscription();
    setIsUploading(false);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProcessingStatus = () => {
    if (error) return 'failed';
    if (isTranscribing || isUploading) return 'processing';
    if (transcript) return 'completed';
    return 'idle';
  };

  const getStatusBadge = () => {
    const status = getProcessingStatus();
    switch (status) {
      case 'processing':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Processando</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Falhou</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Arquivo de Áudio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {selectedFile ? selectedFile.name : 'Selecione um arquivo de áudio'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedFile 
                ? `${formatFileSize(selectedFile.size)} • ${selectedFile.type}`
                : 'Arraste e solte ou clique para selecionar (MP3, WAV, M4A, OGG, WebM)'
              }
            </p>
            {selectedFile && getStatusBadge()}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Processing Controls */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5" />
              Processamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            {(isTranscribing || isUploading) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {isUploading ? 'Enviando arquivo...' : 'Transcrevendo áudio...'}
                  </span>
                  <span>
                    {isUploading ? `${Math.round(uploadProgress)}%` : `${Math.round(progress)}%`}
                  </span>
                </div>
                <Progress 
                  value={isUploading ? uploadProgress : progress} 
                  className="w-full" 
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
              {!isTranscribing && !isUploading ? (
                <Button 
                  onClick={handleStartProcessing}
                  className="flex items-center gap-2"
                  disabled={!selectedFile}
                >
                  <Play className="w-4 h-4" />
                  Iniciar Transcrição
                </Button>
              ) : (
                <Button 
                  onClick={handleStop}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Parar
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Display */}
            {transcript && !isTranscribing && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Transcrição concluída com sucesso!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Transcript Preview */}
      {(transcript || interimTranscript) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isTranscribing && <Loader2 className="w-4 h-4 animate-spin" />}
              Transcrição em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground italic">
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
