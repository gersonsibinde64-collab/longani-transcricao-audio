
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, FileAudio, Target, Type } from 'lucide-react';
import { TranscriptionService } from '@/utils/transcriptionService';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptionText } from '@/components/TranscriptionText';

export function TranscricaoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(0);

  const { data: transcription, isLoading, error } = useQuery({
    queryKey: ['transcription', id],
    queryFn: () => TranscriptionService.getTranscriptionById(id!),
    enabled: !!id,
  });

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleWordClick = (time: number) => {
    setCurrentTime(time);
    // The audio player will sync to this time automatically
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'processing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="space-y-standard">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/transcricoes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando transcrição...</p>
        </div>
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="space-y-standard">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/transcricoes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Transcrição não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-standard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/transcricoes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-normal text-foreground">{transcription.title}</h1>
            <p className="text-muted-foreground mt-1 font-light">
              Detalhes da transcrição
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(transcription.status)}>
          {getStatusText(transcription.status)}
        </Badge>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            Informações do Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground font-light">Data</p>
                <p className="font-kpi text-foreground">
                  {formatDate(transcription.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground font-light">Duração</p>
                <p className="font-kpi text-foreground">
                  {transcription.duration_seconds ? formatDuration(transcription.duration_seconds) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground font-light">Precisão</p>
                <p className="font-kpi text-foreground">
                  {transcription.accuracy_score ? `${transcription.accuracy_score}%` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Type className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground font-light">Palavras</p>
                <p className="font-kpi text-foreground">
                  {transcription.word_count ? transcription.word_count.toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Player */}
      {transcription.audio_file_url && (
        <AudioPlayer
          audioUrl={transcription.audio_file_url}
          transcribedText={transcription.transcribed_text}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      {/* Transcription Text */}
      <TranscriptionText
        text={transcription.transcribed_text}
        currentTime={currentTime}
        onWordClick={handleWordClick}
      />
    </div>
  );
}
