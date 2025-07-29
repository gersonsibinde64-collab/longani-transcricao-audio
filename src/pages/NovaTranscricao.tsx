
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileAudio, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NovaTranscricao() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione um arquivo MP3, WAV ou M4A.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 100MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "Arquivo selecionado",
      description: `${file.name} está pronto para transcrição.`
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const startTranscription = () => {
    if (!selectedFile) return;
    
    toast({
      title: "Transcrição iniciada",
      description: "Seu arquivo está sendo processado. Isso pode levar alguns minutos."
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Nova Transcrição</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload do seu arquivo de áudio para iniciar a transcrição
        </p>
      </div>

      {/* Upload Area */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Upload de Áudio</CardTitle>
          <CardDescription>
            Suporte para arquivos MP3, WAV e M4A (máximo 100MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Arraste e solte seu arquivo aqui
              </h3>
              <p className="text-muted-foreground mb-4">
                ou clique para selecionar um arquivo
              </p>
              <Button variant="outline" className="relative">
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                Selecionar Arquivo
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      {selectedFile && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Configurações</CardTitle>
            <CardDescription>
              Personalize sua transcrição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Transcrição</Label>
              <Input
                id="title"
                placeholder="Digite um título para sua transcrição"
                defaultValue={selectedFile.name.replace(/\.[^/.]+$/, "")}
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
                defaultValue="pt-BR"
              >
                <option value="pt-BR">Português (Brasil)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {selectedFile && (
        <div className="flex justify-center">
          <Button 
            className="bg-primary hover:bg-primary/90 px-8"
            size="lg"
            onClick={startTranscription}
          >
            <Upload className="w-4 h-4 mr-2" />
            Iniciar Transcrição
          </Button>
        </div>
      )}
    </div>
  );
}
