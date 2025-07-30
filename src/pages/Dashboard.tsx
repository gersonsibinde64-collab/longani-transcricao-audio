
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, TrendingUp, Users, Play, Download, Plus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { TranscriptionService } from '@/utils/transcriptionService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: transcriptions = [], isLoading } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: TranscriptionService.getUserTranscriptions,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('not authenticated')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Calculate real statistics from transcriptions
  const totalTranscriptions = transcriptions.length;
  const completedTranscriptions = transcriptions.filter(t => t.status === 'completed').length;
  const totalMinutes = transcriptions.reduce((acc, t) => acc + (t.duration_seconds || 0), 0) / 60;
  const totalWords = transcriptions.reduce((acc, t) => acc + (t.word_count || 0), 0);
  const averageAccuracy = completedTranscriptions > 0 
    ? transcriptions
        .filter(t => t.accuracy_score && t.status === 'completed')
        .reduce((acc, t) => acc + (t.accuracy_score || 0), 0) / completedTranscriptions
    : 0;

  const recentTranscriptions = transcriptions
    .filter(t => t.status === 'completed')
    .slice(0, 3);

  const handleViewTranscription = (id: string) => {
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
      month: 'short',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-standard">
        <div>
          <h1 className="text-3xl font-normal text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Carregando seus dados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-standard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-normal text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 font-light">
            Visão geral das suas transcrições
          </p>
        </div>
        <Button 
          onClick={() => navigate('/transcricoes')}
          className="bg-primary hover:bg-primary/90 font-light focus-blue"
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1} />
          Nova Transcrição
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-standard">
        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-light">
                Total de Transcrições
              </CardDescription>
              <FileText className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="text-2xl font-kpi text-foreground">
              {totalTranscriptions.toLocaleString()}
            </div>
            {completedTranscriptions < totalTranscriptions && (
              <p className="text-xs text-muted-foreground font-light mt-1">
                {completedTranscriptions} concluídas
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-light">
                Horas Transcritas
              </CardDescription>
              <Clock className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="text-2xl font-kpi text-foreground">
              {(totalMinutes / 60).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground font-light mt-1">
              {Math.round(totalMinutes)} minutos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-light">
                Palavras Transcritas
              </CardDescription>
              <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="text-2xl font-kpi text-foreground">
              {totalWords.toLocaleString()}
            </div>
            {completedTranscriptions > 0 && (
              <p className="text-xs text-muted-foreground font-light mt-1">
                ~{Math.round(totalWords / completedTranscriptions)} por transcrição
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-border card-shadow">
          <CardHeader className="p-standard pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-light">
                Precisão Média
              </CardDescription>
              <Users className="w-4 h-4 text-primary" strokeWidth={1} />
            </div>
          </CardHeader>
          <CardContent className="px-standard pb-standard">
            <div className="text-2xl font-kpi text-foreground">
              {averageAccuracy > 0 ? `${averageAccuracy.toFixed(1)}%` : 'N/A'}
            </div>
            {completedTranscriptions > 0 && (
              <p className="text-xs text-muted-foreground font-light mt-1">
                {completedTranscriptions} transcrições
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transcriptions */}
      <Card className="bg-white border-border card-shadow">
        <CardHeader className="p-standard">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-normal text-card-foreground">
                Transcrições Recentes
              </CardTitle>
              <CardDescription className="font-light">
                Suas últimas transcrições concluídas
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/transcricoes')}
              className="font-light hover-light-blue focus-blue"
            >
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-standard pt-0">
          {recentTranscriptions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1} />
              <h3 className="text-lg font-normal mb-2">Nenhuma transcrição encontrada</h3>
              <p className="text-muted-foreground mb-4 font-light">
                Comece criando sua primeira transcrição de áudio
              </p>
              <Button onClick={() => navigate('/transcricoes')}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Transcrição
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTranscriptions.map((transcription) => (
                <div key={transcription.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-primary" strokeWidth={1} />
                    </div>
                    <div>
                      <h4 className="font-normal text-foreground">{transcription.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-light">
                        <span>{formatDate(transcription.created_at)}</span>
                        {transcription.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(transcription.duration_seconds)}</span>
                          </>
                        )}
                        {transcription.word_count && (
                          <>
                            <span>•</span>
                            <span>{transcription.word_count.toLocaleString()} palavras</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTranscription(transcription.id)}
                      className="font-light hover-light-blue focus-blue"
                    >
                      <Play className="w-4 h-4 mr-2" strokeWidth={1} />
                      Ver
                    </Button>
                    {transcription.transcribed_text && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(transcription)}
                        className="font-light hover-light-blue focus-blue"
                      >
                        <Download className="w-4 h-4 mr-2" strokeWidth={1} />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
