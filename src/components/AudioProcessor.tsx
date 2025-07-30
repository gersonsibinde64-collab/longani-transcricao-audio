
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Play, Square, FileAudio, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranscription } from '@/hooks/useTranscription';
import { supabase } from '@/integrations/supabase/client';

const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷' }
];

export const AudioProcessor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]);
    }
  };

  const uploadAudioFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStartTranscription = async () => {
    if (!selectedFile) return;

    try {
      // Upload audio file to storage
      const audioUrl = await uploadAudioFile(selectedFile);
      
      // Start transcription with audio URL
      await transcribeAudio(selectedFile, {
        language: selectedLanguage,
        continuous: true,
        interimResults: true
      }, audioUrl);
    } catch (err) {
      console.error('Erro na transcrição:', err);
    }
  };

  if (!isWebSpeechSupported()) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Navegador não suportado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta a Web Speech API. 
              Por favor, use Chrome, Edge ou Safari para utilizar a funcionalidade de transcrição.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            Processador de Áudio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="audio-file">Arquivo de Áudio</Label>
            <div className="flex items-center gap-4">
              <Input
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                disabled={isTranscribing || isUploading}
                className="flex-1"
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Transcrição</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isTranscribing || isUploading}
              placeholder="Digite um título para sua transcrição"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isTranscribing || isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartTranscription}
              disabled={!selectedFile || isTranscribing || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <Upload className="w-4 h-4" />
              ) : isTranscribing ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isUploading ? 'Enviando...' : isTranscribing ? 'Processando...' : 'Iniciar Transcrição'}
            </Button>
            
            {isTranscribing && (
              <Button
                variant="outline"
                onClick={stopTranscription}
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Parar
              </Button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivo</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Transcription Progress Bar */}
          {isTranscribing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da transcrição</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transcription Results */}
      {(transcript || interimTranscript) && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Transcrição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Texto transcrito:
                </div>
                <div className="text-foreground">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">
                      {interimTranscript}
                    </span>
                  )}
                </div>
              </div>
              
              {transcript && (
                <div className="text-sm text-muted-foreground">
                  Palavras: {transcript.trim().split(/\s+/).filter(word => word.length > 0).length}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
