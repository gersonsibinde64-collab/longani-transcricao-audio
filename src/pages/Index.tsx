import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Loader2, FileAudio, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHybridTranscription } from "@/hooks/useHybridTranscription";
import { useChunkedTranscription } from "@/hooks/useChunkedTranscription";
import { useAudioPreferences } from "@/hooks/useAudioPreferences";
import { AudioControls } from "@/components/AudioControls";
import { AudioPreferencesSettings } from "@/components/AudioPreferencesSettings";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioState, setAudioState] = useState({ isPlaying: false, isMuted: true });
  
  const { toast } = useToast();
  const { preferences } = useAudioPreferences();
  
  const hybridTranscription = useHybridTranscription();
  const chunkedTranscription = useChunkedTranscription();

  // Use chunked for files under 50MB, hybrid for larger files
  const shouldUseChunked = useCallback((file: File) => {
    return file.size <= 50 * 1024 * 1024; // 50MB limit for local chunked processing
  }, []);

  const activeTranscription = selectedFile && shouldUseChunked(selectedFile) 
    ? chunkedTranscription 
    : hybridTranscription;

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/ogg'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Use apenas MP3, WAV ou M4A.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB absolute limit
      toast({
        title: "Arquivo muito grande",
        description: "Máximo 500MB permitido.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    activeTranscription.clearTranscript();
    
    // Create audio URL for playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    const processingMethod = shouldUseChunked(file) ? 'chunked local' : 'hybrid';
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    toast({
      title: 'Arquivo carregado',
      description: `${file.name} (${fileSizeMB}MB) - ${processingMethod}`,
    });

    // Auto-start transcription if not muted by default
    if (!preferences.muteByDefault) {
      try {
        const transcribeMethod = shouldUseChunked(file) 
          ? chunkedTranscription.transcribeAudioChunked 
          : hybridTranscription.transcribeAudio;

        const result = await transcribeMethod(file, {
          language: 'pt-BR',
          continuous: true,
          interimResults: true
        });
        setTranscriptionResult(result.transcribedText || '');
      } catch (error) {
        console.error('Auto-transcription error:', error);
      }
    }
  }, [toast, preferences.muteByDefault, activeTranscription, shouldUseChunked, chunkedTranscription, hybridTranscription]);

  const handleManualTranscription = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const transcribeMethod = shouldUseChunked(selectedFile) 
        ? chunkedTranscription.transcribeAudioChunked 
        : hybridTranscription.transcribeAudio;

      const result = await transcribeMethod(selectedFile, {
        language: 'pt-BR',
        continuous: true,
        interimResults: true
      });
      setTranscriptionResult(result.transcribedText || '');
    } catch (error) {
      console.error('Manual transcription error:', error);
    }
  }, [selectedFile, shouldUseChunked, chunkedTranscription, hybridTranscription]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(() => {
    const finalText = transcriptionResult || activeTranscription.transcript;
    if (!finalText.trim()) return;

    const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcricao'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Clear all data after download
    setTimeout(() => {
      setSelectedFile(null);
      setTranscriptionResult('');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      activeTranscription.clearTranscript();
    }, 1000);
  }, [transcriptionResult, activeTranscription.transcript, selectedFile?.name, audioUrl, activeTranscription]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionResult('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    activeTranscription.clearTranscript();
  }, [audioUrl, activeTranscription]);

  if (!activeTranscription.isWebSpeechSupported && !activeTranscription.isWebSpeechSupported()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light text-foreground mb-4">
            Navegador não suportado
          </h2>
          <p className="text-muted-foreground font-light">
            Use Chrome, Edge ou Safari para transcrever áudio.
          </p>
        </div>
      </div>
    );
  }

  const finalTranscript = transcriptionResult || activeTranscription.transcript;
  const showDownload = finalTranscript && !activeTranscription.isTranscribing;
  const currentProgress = chunkedTranscription.chunkProgress 
    ? Math.round((chunkedTranscription.chunkProgress.currentChunk / chunkedTranscription.chunkProgress.totalChunks) * 100)
    : activeTranscription.progress;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header with Settings */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-5xl font-light text-foreground">Longani</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xl text-muted-foreground font-light">
            Transcreva áudio para texto
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6">
            <AudioPreferencesSettings />
          </div>
        )}

        {/* Main Content */}
        <div className="min-h-[70vh] flex flex-col">
          {/* Drop Zone */}
          <div
            className={`
              flex-1 border-2 border-dashed rounded-2xl 
              flex flex-col items-center justify-center
              transition-all duration-300 cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : selectedFile 
                  ? 'border-border bg-accent/30'
                  : 'border-border hover:border-primary/50 hover:bg-accent/20'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && document.getElementById('file-input')?.click()}
          >
            {!selectedFile ? (
              <div className="text-center px-8">
                <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center mb-8 mx-auto">
                  <Upload className="w-12 h-12 text-primary" strokeWidth={1} />
                </div>
                <h2 className="text-4xl font-light text-foreground mb-6">
                  Arraste seu áudio aqui
                </h2>
                <p className="text-xl text-muted-foreground font-light mb-8">
                  MP3, WAV ou M4A • Máximo 500MB
                </p>
                <Button size="lg" className="px-12 py-6 text-lg font-light">
                  <Upload className="w-5 h-5 mr-3" strokeWidth={1.5} />
                  Selecionar arquivo
                </Button>
              </div>
            ) : (
              <div className="text-center px-8 w-full max-w-2xl">
                <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  {activeTranscription.isTranscribing ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" strokeWidth={1.5} />
                  ) : (
                    <FileAudio className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                
                <h3 className="text-2xl font-light text-foreground mb-2">
                  {selectedFile.name}
                </h3>
                
                <p className="text-lg text-muted-foreground font-light mb-6">
                  {activeTranscription.isTranscribing 
                    ? chunkedTranscription.chunkProgress 
                      ? `Processando segmento ${chunkedTranscription.chunkProgress.currentChunk} de ${chunkedTranscription.chunkProgress.totalChunks}`
                      : 'Transcrevendo...'
                    : showDownload 
                      ? 'Concluído' 
                      : 'Pronto para transcrever'
                  }
                </p>

                {activeTranscription.isTranscribing && preferences.showVisualProgress && (
                  <div className="mb-6 w-full">
                    <Progress value={currentProgress} className="w-full h-3" />
                    <p className="text-sm text-muted-foreground font-light mt-2">
                      {Math.round(currentProgress)}%
                    </p>
                  </div>
                )}

                {!activeTranscription.isTranscribing && (
                  <div className="space-x-4">
                    <Button onClick={handleManualTranscription} className="font-light">
                      Iniciar Transcrição
                    </Button>
                    <Button variant="outline" onClick={handleReset} className="font-light">
                      Novo arquivo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audio Controls */}
          {audioUrl && (
            <div className="mt-6">
              <AudioControls
                audioUrl={audioUrl}
                isTranscribing={activeTranscription.isTranscribing}
                onAudioStateChange={(isPlaying, isMuted) => setAudioState({ isPlaying, isMuted })}
              />
            </div>
          )}

          {/* Transcription Results */}
          {(finalTranscript || activeTranscription.interimTranscript) && (
            <Card className="mt-8 bg-white border-border">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <p className="text-lg leading-relaxed text-foreground font-light">
                    {finalTranscript}
                    {activeTranscription.interimTranscript && (
                      <span className="text-muted-foreground italic">
                        {activeTranscription.interimTranscript}
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Button */}
          {showDownload && (
            <div className="text-center mt-8">
              <Button 
                onClick={handleDownload}
                size="lg"
                className="px-12 py-6 text-lg font-light"
              >
                <Download className="w-5 h-5 mr-3" strokeWidth={1.5} />
                Baixar TXT
              </Button>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          id="file-input"
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
