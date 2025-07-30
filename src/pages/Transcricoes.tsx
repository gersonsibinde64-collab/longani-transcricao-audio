import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Play, MoreVertical, Plus, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';
import { TranscriptionService } from '@/utils/transcriptionService';
import { useToast } from '@/hooks/use-toast';
import { AudioProcessor } from '@/components/AudioProcessor';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Transcricoes() {
  const [showProcessor, setShowProcessor] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: transcriptions = [], isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: TranscriptionService.getUserTranscriptions,
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication error
      if (error instanceof Error && error.message.includes('not authenticated')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transcrição? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await TranscriptionService.deleteTranscription(id);
      toast({
        title: "Transcrição excluída",
        description: "A transcrição foi excluída com sucesso.",
      });
      refetch();
    } catch (error) {
      console.error('Error deleting transcription:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir a transcrição.",
        variant: "destructive",
      });
    }
  };

  const handleView = (id: string) => {
    navigate(`/transcricoes/${id}`);
  };

  const handleDownload = async (transcription: any) => {
    if (!transcription.transcribed_text) {
      toast({
        title: "Erro",
        description: "Esta transcrição não possui texto para download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = new Blob([transcription.transcribed_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${transcription.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: "A transcrição foi baixada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer o download da transcrição.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'processing':
        return 'bg-yellow-50 text-yellow-700';
      case 'failed':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'processing':
        return 'Processando';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  if (showProcessor) {
    return (
      <div className="space-y-standard">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-normal text-foreground">Nova Transcrição</h1>
            <p className="text-muted-foreground mt-2 font-light">
              Processe um arquivo de áudio para transcrição
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowProcessor(false)}
            className="font-light focus-blue"
          >
            Voltar às Transcrições
          </Button>
        </div>
        <AudioProcessor />
      </div>
    );
  }

  return (
    <div className="space-y-standard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-normal text-foreground">Transcrições</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Gerencie todas as suas transcrições de áudio
          </p>
        </div>
        <Button 
          onClick={() => setShowProcessor(true)}
          className="bg-primary hover:bg-primary/90 font-light focus-blue"
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1} />
          Nova Transcrição
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando transcrições...</p>
        </div>
      )}

      {/* Error State */}
      {queryError && !isLoading && (
        <Card className="text-center py-8">
          <CardContent>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" strokeWidth={1} />
            <h3 className="text-lg font-normal mb-2">Erro ao carregar transcrições</h3>
            <p className="text-muted-foreground mb-4">
              {queryError instanceof Error ? queryError.message : 'Ocorreu um erro inesperado'}
            </p>
            <Button onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !queryError && transcriptions.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1} />
            <h3 className="text-lg font-normal mb-2">Nenhuma transcrição encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira transcrição de áudio
            </p>
            <Button onClick={() => setShowProcessor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transcrição
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transcriptions Grid */}
      {!isLoading && !queryError && transcriptions.length > 0 && (
        <div className="grid gap-standard">
          {transcriptions.map((transcription) => (
            <Card key={transcription.id} className="bg-white border-border card-shadow hover:card-shadow-lg transition-shadow duration-200">
              <CardHeader className="p-standard">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" strokeWidth={1} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-normal text-card-foreground">
                        {transcription.title}
                      </CardTitle>
                      <CardDescription className="mt-1 font-light">
                        {formatDate(transcription.created_at)} • {transcription.duration_seconds ? formatDuration(transcription.duration_seconds) : 'N/A'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover-light-blue focus-blue">
                        <MoreVertical className="w-4 h-4" strokeWidth={1} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white card-shadow">
                      <DropdownMenuItem 
                        className="font-light hover-light-blue"
                        onClick={() => handleView(transcription.id)}
                      >
                        <Play className="w-4 h-4 mr-2" strokeWidth={1} />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="font-light hover-light-blue">
                        <Download className="w-4 h-4 mr-2" strokeWidth={1} />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="font-light hover-light-blue text-destructive"
                        onClick={() => handleDelete(transcription.id)}
                      >
                        <FileText className="w-4 h-4 mr-2" strokeWidth={1} />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="px-standard pb-standard">
                <div className="flex items-center justify-between">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground font-light">Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-light ${getStatusColor(transcription.status)}`}>
                        {getStatusText(transcription.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-light">Precisão</p>
                      <p className="font-kpi text-foreground">
                        {transcription.accuracy_score ? `${transcription.accuracy_score}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-light">Palavras</p>
                      <p className="font-kpi text-foreground">
                        {transcription.word_count ? transcription.word_count.toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-light hover-light-blue focus-blue"
                      onClick={() => handleView(transcription.id)}
                    >
                      <Play className="w-4 h-4 mr-2" strokeWidth={1} />
                      Visualizar
                    </Button>
                    {transcription.transcribed_text && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-light hover-light-blue focus-blue"
                        onClick={() => handleDownload(transcription)}
                      >
                        <Download className="w-4 h-4 mr-2" strokeWidth={1} />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
