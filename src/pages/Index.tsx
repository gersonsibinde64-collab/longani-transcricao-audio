import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Loader2, FileAudio, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntelligentTranscription } from "@/hooks/useIntelligentTranscription";
import { TranscriptionQuality } from "@/components/TranscriptionQuality";
import { splitAudioFile } from "@/utils/audioSplitter";

type AppState = 'initial' | 'uploading' | 'processing' | 'completed' | 'error';

const MAX_AUDIO_DURATION = 180; // 3 minutes in seconds

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<string[]>([]);
  const [appState, setAppState] = useState<AppState>('initial');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [needsSplitting, setNeedsSplitting] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  
  // Transcription settings
  const [language, setLanguage] = useState<'pt-PT' | 'pt-MZ'>('pt-PT');
  const [useIntelligent, setUseIntelligent] = useState(true);
  const [autoStructure, setAutoStructure] = useState(true);
  
  const { toast } = useToast();
  const intelligentTranscription = useIntelligentTranscription();

  const getAudioDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio file'));
      });
      audio.src = URL.createObjectURL(file);
    });
  }, []);

  const downloadTranscription = useCallback((text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

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

    try {
      const duration = await getAudioDuration(file);
      setAudioDuration(duration);
      setSelectedFile(file);
      setAppState('uploading');
      
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      const durationMin = Math.ceil(duration / 60);
      
      if (duration > MAX_AUDIO_DURATION) {
        setNeedsSplitting(true);
        const chunks = Math.ceil(duration / MAX_AUDIO_DURATION);
        setTotalChunks(chunks);
        
        toast({
          title: 'Ficheiro longo detectado',
          description: `${durationMin}min de áudio será dividido em ${chunks} partes para melhor processamento`,
        });
      } else {
        setNeedsSplitting(false);
        toast({
          title: 'Ficheiro carregado com sucesso',
          description: `${file.name} (${fileSizeMB}MB, ${durationMin}min) - Pronto para transcrição`,
        });
      }
    } catch (error) {
      setAppState('error');
      toast({
        title: "Erro ao processar ficheiro",
        description: "Não foi possível analisar o ficheiro de áudio.",
        variant: "destructive"
      });
    }
  }, [toast, getAudioDuration]);

  const processAudioChunks = useCallback(async () => {
    if (!selectedFile) return;

    setAppState('processing');
    setTranscriptionResults([]);
    intelligentTranscription.clearTranscript();

    try {
      if (needsSplitting) {
        // Split audio into chunks
        const chunks = await splitAudioFile(selectedFile, MAX_AUDIO_DURATION);
        setTotalChunks(chunks.length);
        
        // Process each chunk sequentially
        for (let i = 0; i < chunks.length; i++) {
          setCurrentChunk(i + 1);
          
          toast({
            title: `Processando parte ${i + 1} de ${chunks.length}`,
            description: `Transcrevendo segmento ${i + 1}...`,
          });

          try {
            const result = await intelligentTranscription.transcribeAudio(chunks[i], {
              language: language,
              continuous: true,
              interimResults: true,
              dialect: language,
              enableIntelligentFormatting: useIntelligent && autoStructure,
              enableStructureDetection: useIntelligent && autoStructure,
              enablePunctuationRestoration: useIntelligent
            });

            const chunkText = result.transcribedText || '';
            setTranscriptionResults(prev => [...prev, chunkText]);
            
            // Auto-download each chunk
            const filename = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_parte_${i + 1}.txt`;
            downloadTranscription(chunkText, filename);
            
            toast({
              title: `Parte ${i + 1} concluída`,
              description: `${result.wordCount} palavras transcritas e descarregadas`,
            });
            
            // Small delay between chunks
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError);
            toast({
              title: `Erro na parte ${i + 1}`,
              description: 'Continuando com a próxima parte...',
              variant: 'destructive',
            });
          }
        }
        
        setAppState('completed');
        
      } else {
        // Process single file normally
        const result = await intelligentTranscription.transcribeAudio(selectedFile, {
          language: language,
          continuous: true,
          interimResults: true,
          dialect: language,
          enableIntelligentFormatting: useIntelligent && autoStructure,
          enableStructureDetection: useIntelligent && autoStructure,
          enablePunctuationRestoration: useIntelligent
        });
        
        const transcriptText = result.transcribedText || '';
        setTranscriptionResults([transcriptText]);
        
        // Auto-download single file
        const filename = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_transcricao.txt`;
        downloadTranscription(transcriptText, filename);
        
        setAppState('completed');
        
        toast({
          title: 'Transcrição concluída',
          description: `${result.wordCount} palavras transcritas e descarregadas`,
        });
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      setAppState('error');
      toast({
        title: 'Erro na transcrição',
        description: 'Ocorreu um erro durante a transcrição. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [selectedFile, language, useIntelligent, autoStructure, intelligentTranscription, toast, needsSplitting, downloadTranscription]);

  const handleNewTranscription = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionResults([]);
    setAppState('initial');
    setAudioDuration(0);
    setNeedsSplitting(false);
    setCurrentChunk(0);
    setTotalChunks(0);
    
    intelligentTranscription.clearTranscript();
    
    toast({
      title: 'Nova transcrição',
      description: 'Pronto para transcrever um novo ficheiro.',
    });
  }, [intelligentTranscription, toast]);

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

                  {/* Format Options */}
                  {useIntelligent && (
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-structure" checked={autoStructure} 
                                onCheckedChange={(checked) => setAutoStructure(checked === true)} />
                      <label htmlFor="auto-structure" className="text-sm">
                        Adicionar estrutura automática
                      </label>
                    </div>
                  )}
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
              
              <p className="text-muted-foreground mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB • {Math.ceil(audioDuration / 60)}min • {language === 'pt-PT' ? 'Português Europeu' : 'Português Moçambicano'}
              </p>

              {needsSplitting && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Ficheiro será dividido</span>
                  </div>
                  <p className="text-sm text-yellow-700 text-center">
                    Áudio > 3min será processado em {totalChunks} partes sequenciais.
                    Cada parte será descarregada automaticamente após transcrição.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Button onClick={processAudioChunks} size="lg" className="font-light px-8">
                  {needsSplitting ? `Iniciar processamento (${totalChunks} partes)` : 'Iniciar transcrição'}
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
                {needsSplitting ? `Processando parte ${currentChunk} de ${totalChunks}` : 'A transcrever o áudio...'}
              </h3>
              
              <div className="w-full max-w-md mb-6">
                <Progress value={intelligentTranscription.progress} className="w-full h-3" />
                <p className="text-sm text-muted-foreground font-light mt-2">
                  {Math.round(intelligentTranscription.progress)}% concluído
                </p>
              </div>

              {needsSplitting && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 text-center">
                    {transcriptionResults.length > 0 && `${transcriptionResults.length} parte(s) já processada(s) e descarregada(s)`}
                  </p>
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
                accuracy={intelligentTranscription.processingQuality}
              />
            </div>
          )}

          {/* COMPLETED STATE */}
          {appState === 'completed' && transcriptionResults.length > 0 && (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-light text-foreground mb-2">
                  {needsSplitting ? 'Processamento concluído' : 'Transcrição concluída'}
                </h3>
                <p className="text-muted-foreground font-light">
                  {needsSplitting 
                    ? `${transcriptionResults.length} partes processadas e descarregadas`
                    : `${transcriptionResults[0]?.split(' ').length || 0} palavras • ${language === 'pt-PT' ? 'Português Europeu' : 'Português Moçambicano'}`
                  }
                </p>
              </div>

              {/* Summary Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {needsSplitting ? (
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={1} />
                        <h4 className="text-xl font-medium mb-2">
                          {transcriptionResults.length} ficheiros descarregados
                        </h4>
                        <p className="text-muted-foreground">
                          Todas as partes foram transcritas e descarregadas automaticamente.
                          Verifique a sua pasta de descargas.
                        </p>
                      </div>
                    ) : (
                      <div 
                        className="leading-relaxed text-foreground font-light"
                        style={{ whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{ __html: transcriptionResults[0]?.replace(/\n/g, '<br>') }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
