
import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Loader2, FileAudio, Settings, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntelligentTranscription } from "@/hooks/useIntelligentTranscription";
import { AudioControls } from "@/components/AudioControls";
import { TranscriptionQuality } from "@/components/TranscriptionQuality";

type AppState = 'initial' | 'uploading' | 'processing' | 'completed' | 'error';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('initial');
  const [audioMuted, setAudioMuted] = useState(true);
  
  // Transcription settings
  const [language, setLanguage] = useState<'pt-PT' | 'pt-MZ'>('pt-PT');
  const [useIntelligent, setUseIntelligent] = useState(true);
  const [muteAudio, setMuteAudio] = useState(true);
  const [autoStructure, setAutoStructure] = useState(true);
  
  const { toast } = useToast();
  const intelligentTranscription = useIntelligentTranscription();

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/ogg'];
    
    if (!allowedTypes.includes(file.type)) {
      setAppState('error');
      toast({
        title: "Formato não suportado",
        description: "Utilize apenas ficheiros MP3, WAV ou M4A.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setAppState('error');
      toast({
        title: "Ficheiro demasiado grande",
        description: "Tamanho máximo: 100MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setAppState('uploading');
    
    // Create audio URL for playback
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    
    toast({
      title: 'Ficheiro carregado com sucesso',
      description: `${file.name} (${fileSizeMB}MB) - Pronto para transcrição`,
    });
  }, [toast]);

  const handleStartTranscription = useCallback(async () => {
    if (!selectedFile) return;

    setAppState('processing');
    intelligentTranscription.clearTranscript();

    try {
      const result = await intelligentTranscription.transcribeAudio(selectedFile, {
        language: language,
        continuous: true,
        interimResults: true,
        dialect: language,
        enableIntelligentFormatting: useIntelligent && autoStructure,
        enableStructureDetection: useIntelligent && autoStructure,
        enablePunctuationRestoration: useIntelligent
      });
      
      setTranscriptionResult(result.transcribedText || '');
      setAppState('completed');
      
      toast({
        title: 'Transcrição concluída',
        description: `${result.wordCount} palavras transcritas com sucesso`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      setAppState('error');
      toast({
        title: 'Erro na transcrição',
        description: 'Ocorreu um erro durante a transcrição. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [selectedFile, language, useIntelligent, autoStructure, intelligentTranscription, toast]);

  const handleDownload = useCallback(() => {
    const finalText = transcriptionResult || intelligentTranscription.transcript;
    if (!finalText.trim()) return;

    const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcrição_${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Audio'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Transcrição descarregada',
      description: 'O ficheiro foi guardado no seu dispositivo.',
    });
  }, [transcriptionResult, intelligentTranscription.transcript, selectedFile?.name, toast]);

  const handleNewTranscription = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionResult('');
    setAppState('initial');
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    intelligentTranscription.clearTranscript();
    
    toast({
      title: 'Nova transcrição',
      description: 'Pronto para transcrever um novo ficheiro.',
    });
  }, [audioUrl, intelligentTranscription, toast]);

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

  if (!intelligentTranscription.isWebSpeechSupported()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light text-foreground mb-4">
            Navegador não compatível
          </h2>
          <p className="text-muted-foreground font-light">
            Utilize Chrome, Edge ou Safari para transcrever áudio.
          </p>
        </div>
      </div>
    );
  }

  const finalTranscript = transcriptionResult || intelligentTranscription.transcript;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Longani Header */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-sm font-light text-muted-foreground opacity-60">
          Longani
        </span>
      </div>

      <div className="flex flex-col min-h-screen p-4 md:p-8">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
          
          {/* INITIAL STATE */}
          {appState === 'initial' && (
            <>
              {/* Header */}
              <div className="text-center mb-8 pt-8">
                <h1 className="text-5xl md:text-7xl font-light text-foreground mb-4">
                  Transcrição de Áudio
                </h1>
                <p className="text-xl text-muted-foreground font-light">
                  Converta o seu áudio em texto com qualidade profissional
                </p>
              </div>

              {/* Settings Panel */}
              <Card className="mb-8">
                <CardContent className="p-6 space-y-6">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Idioma da transcrição</label>
                    <Select value={language} onValueChange={(value: 'pt-PT' | 'pt-MZ') => setLanguage(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-PT">🇵🇹 Português Europeu</SelectItem>
                        <SelectItem value="pt-MZ">🇲🇿 Português Moçambicano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de transcrição</label>
                    <Select value={useIntelligent ? 'intelligent' : 'basic'} 
                            onValueChange={(value) => setUseIntelligent(value === 'intelligent')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intelligent">✨ Transcrição Inteligente</SelectItem>
                        <SelectItem value="basic">📝 Transcrição Básica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Audio & Format Options */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mute-audio" checked={muteAudio} 
                                onCheckedChange={(checked) => setMuteAudio(checked === true)} />
                      <label htmlFor="mute-audio" className="text-sm">
                        Silenciar áudio durante transcrição
                      </label>
                    </div>

                    {useIntelligent && (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="auto-structure" checked={autoStructure} 
                                  onCheckedChange={(checked) => setAutoStructure(checked === true)} />
                        <label htmlFor="auto-structure" className="text-sm">
                          Adicionar estrutura automática
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Huge Drop Zone */}
              <div
                className={`
                  flex-1 min-h-[60vh] border-2 border-dashed rounded-3xl 
                  flex flex-col items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.01]' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/20'
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="text-center px-8">
                  <div className="w-28 h-28 bg-accent rounded-3xl flex items-center justify-center mb-8 mx-auto">
                    <Upload className="w-14 h-14 text-primary" strokeWidth={1} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
                    Arraste o seu ficheiro áudio aqui
                  </h2>
                  <p className="text-xl text-muted-foreground font-light mb-8">
                    MP3, WAV, M4A aceites (até 100MB)
                  </p>
                  <Button size="lg" className="px-12 py-6 text-lg font-light">
                    <Upload className="w-5 h-5 mr-3" strokeWidth={1.5} />
                    Seleccionar ficheiro
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* UPLOADING STATE */}
          {appState === 'uploading' && selectedFile && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center mb-6">
                <FileAudio className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-3xl font-light text-foreground mb-4">
                Ficheiro carregado
              </h3>
              
              <p className="text-lg text-muted-foreground font-light mb-2">
                {selectedFile.name}
              </p>
              
              <p className="text-muted-foreground mb-8">
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB • {language === 'pt-PT' ? 'Português Europeu' : 'Português Moçambicano'}
              </p>

              {/* Audio Controls */}
              {audioUrl && (
                <div className="mb-8 w-full max-w-md">
                  <AudioControls
                    audioUrl={audioUrl}
                    isTranscribing={false}
                    onAudioStateChange={(isPlaying, isMuted) => setAudioMuted(isMuted)}
                  />
                </div>
              )}

              <div className="space-y-4">
                <Button onClick={handleStartTranscription} size="lg" className="font-light px-8">
                  Iniciar transcrição
                </Button>
                <Button variant="outline" onClick={handleNewTranscription} className="font-light">
                  Escolher outro ficheiro
                </Button>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {appState === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-3xl font-light text-foreground mb-4">
                A transcrever o áudio...
              </h3>
              
              <div className="w-full max-w-md mb-6">
                <Progress value={intelligentTranscription.progress} className="w-full h-3" />
                <p className="text-sm text-muted-foreground font-light mt-2">
                  {Math.round(intelligentTranscription.progress)}% concluído
                </p>
              </div>

              {/* Audio controls during processing */}
              {audioUrl && (
                <div className="mb-6 w-full max-w-md">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAudioMuted(!audioMuted)}
                      className="font-light"
                    >
                      {audioMuted ? (
                        <>
                          <VolumeX className="w-4 h-4 mr-2" />
                          Activar som
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 mr-2" />
                          Silenciar áudio
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Live transcript preview */}
              {intelligentTranscription.transcript && (
                <Card className="w-full max-w-2xl mt-6">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground font-light">
                      {intelligentTranscription.transcript}
                      {intelligentTranscription.interimTranscript && (
                        <span className="italic opacity-60">
                          {intelligentTranscription.interimTranscript}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}

              <TranscriptionQuality 
                quality={intelligentTranscription.processingQuality}
                className="mt-4"
              />
            </div>
          )}

          {/* COMPLETED STATE */}
          {appState === 'completed' && finalTranscript && (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-light text-foreground mb-2">
                  Transcrição concluída
                </h3>
                <p className="text-muted-foreground font-light">
                  {finalTranscript.split(' ').length} palavras • {language === 'pt-PT' ? 'Português Europeu' : 'Português Moçambicano'}
                </p>
              </div>

              {/* Transcription Result */}
              <Card className="flex-1 mb-6">
                <CardContent className="p-6">
                  <div className="prose prose-lg max-w-none">
                    <div 
                      className="leading-relaxed text-foreground font-light"
                      style={{ whiteSpace: 'pre-line' }}
                      dangerouslySetInnerHTML={{ __html: finalTranscript.replace(/\n/g, '<br>') }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleDownload}
                  size="lg"
                  className="px-8 py-3 text-lg font-light"
                >
                  <Download className="w-5 h-5 mr-3" strokeWidth={1.5} />
                  Descarregar transcrição
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleNewTranscription}
                  size="lg"
                  className="px-8 py-3 font-light"
                >
                  <RotateCcw className="w-5 h-5 mr-3" strokeWidth={1.5} />
                  Fazer nova transcrição
                </Button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {appState === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-red-500" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-3xl font-light text-foreground mb-4">
                Erro na transcrição
              </h3>
              
              <p className="text-lg text-muted-foreground font-light mb-8">
                Ocorreu um erro. Verifique o ficheiro e tente novamente.
              </p>

              <div className="space-y-4">
                <Button onClick={handleNewTranscription} size="lg" className="font-light px-8">
                  Tentar novamente
                </Button>
              </div>
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
