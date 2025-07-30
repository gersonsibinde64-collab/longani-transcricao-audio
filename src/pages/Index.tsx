
import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileAudio, Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranscription } from "@/hooks/useTranscription";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const { toast } = useToast();
  const { 
    isTranscribing, 
    transcript, 
    interimTranscript, 
    error, 
    progress, 
    transcribeAudio, 
    isWebSpeechSupported 
  } = useTranscription();

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Use apenas MP3, WAV ou M4A.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Máximo 50MB permitido.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Start transcription immediately
    try {
      const result = await transcribeAudio(file, {
        language: 'pt-BR',
        continuous: true,
        interimResults: true
      });
      setTranscriptionResult(result.transcribedText || '');
    } catch (error) {
      console.error('Transcription error:', error);
      setSelectedFile(null);
    }
  }, [transcribeAudio, toast]);

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
    const finalText = transcriptionResult || transcript;
    if (!finalText.trim()) {
      toast({
        title: "Nada para baixar",
        description: "A transcrição está vazia.",
        variant: "destructive"
      });
      return;
    }

    try {
      const blob = new Blob([finalText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcricao'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: "Arquivo salvo com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  }, [transcriptionResult, transcript, selectedFile?.name, toast]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionResult('');
  }, []);

  // Check if Web Speech API is supported
  if (!isWebSpeechSupported()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full bg-white border-border">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-medium mb-2">Navegador não suportado</h2>
            <p className="text-muted-foreground">
              Use Chrome, Edge ou Safari para transcrever áudio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-light text-foreground mb-2">
            Longani
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            Transcreva áudio para texto em segundos
          </p>
        </div>

        {/* Main Content */}
        {!selectedFile ? (
          // Upload Zone
          <Card className="bg-white border-border">
            <CardContent className="p-12">
              <div
                className={`border-2 border-dashed rounded-xl p-16 text-center transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="mx-auto w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mb-8">
                  <Upload className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-light text-foreground mb-4">
                  Arraste seu arquivo de áudio aqui
                </h2>
                <p className="text-lg text-muted-foreground mb-8 font-light">
                  Suporte para MP3, WAV e M4A • Máximo 50MB
                </p>
                <Button 
                  size="lg" 
                  className="relative bg-primary hover:bg-primary/90 font-light px-8 py-6 text-lg"
                >
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Upload className="w-5 h-5 mr-3" strokeWidth={1.5} />
                  Ou clique para selecionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Transcription Interface
          <div className="space-y-6">
            {/* File Info */}
            <Card className="bg-white border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <FileAudio className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{selectedFile.name}</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="font-light"
                  >
                    Novo arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {isTranscribing && (
              <Card className="bg-white border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" strokeWidth={1.5} />
                    <span className="font-medium text-foreground">Transcrevendo...</span>
                    <span className="text-sm text-muted-foreground font-light">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="bg-white border-border border-destructive">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={1.5} />
                    <p className="text-destructive">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcription Result */}
            <Card className="bg-white border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Transcrição</h3>
                  {(transcriptionResult || transcript) && !isTranscribing && (
                    <Button 
                      onClick={handleDownload}
                      className="bg-primary hover:bg-primary/90 font-light"
                    >
                      <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Baixar TXT
                    </Button>
                  )}
                </div>
                
                <div className="min-h-[200px] p-4 bg-accent rounded-lg border border-border">
                  {isTranscribing ? (
                    <div className="text-muted-foreground font-light">
                      <div>{transcript}</div>
                      {interimTranscript && (
                        <div className="opacity-60 italic">{interimTranscript}</div>
                      )}
                      {!transcript && !interimTranscript && (
                        <div className="italic">Aguardando transcrição...</div>
                      )}
                    </div>
                  ) : transcriptionResult || transcript ? (
                    <div className="text-foreground leading-relaxed">
                      {transcriptionResult || transcript}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic font-light">
                      A transcrição aparecerá aqui...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
