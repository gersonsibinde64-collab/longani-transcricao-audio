
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface TranscriptionQualityProps {
  accuracy: number;
  processingQuality?: number;
  structure?: {
    paragraphs: number;
    headings: number;
    lists: number;
    quotes: number;
  };
}

export const TranscriptionQuality: React.FC<TranscriptionQualityProps> = ({
  accuracy,
  processingQuality = 0,
  structure
}) => {
  const getQualityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excelente', color: 'text-green-600', icon: CheckCircle };
    if (score >= 80) return { level: 'Boa', color: 'text-blue-600', icon: CheckCircle };
    if (score >= 70) return { level: 'Satisfatória', color: 'text-yellow-600', icon: AlertCircle };
    return { level: 'Precisa melhoria', color: 'text-red-600', icon: AlertCircle };
  };

  const accuracyInfo = getQualityLevel(accuracy);
  const processingInfo = getQualityLevel(processingQuality);
  const Icon = accuracyInfo.icon;

  return (
    <div className="bg-accent/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Qualidade da Transcrição</span>
      </div>

      {/* Accuracy Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Precisão</span>
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${accuracyInfo.color}`} />
            <Badge variant="outline" className="text-xs">
              {accuracy.toFixed(1)}%
            </Badge>
          </div>
        </div>
        <Progress value={accuracy} className="h-2" />
      </div>

      {/* Processing Quality */}
      {processingQuality > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Processamento IA</span>
            <Badge variant="outline" className="text-xs">
              {processingQuality.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={processingQuality} className="h-2" />
        </div>
      )}

      {/* Structure Information */}
      {structure && (
        <div className="pt-2 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {structure.paragraphs > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parágrafos</span>
                <span className="font-medium">{structure.paragraphs}</span>
              </div>
            )}
            {structure.headings > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Títulos</span>
                <span className="font-medium">{structure.headings}</span>
              </div>
            )}
            {structure.lists > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listas</span>
                <span className="font-medium">{structure.lists}</span>
              </div>
            )}
            {structure.quotes > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Citações</span>
                <span className="font-medium">{structure.quotes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
