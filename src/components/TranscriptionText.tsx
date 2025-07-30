
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionTextProps {
  text?: string;
  currentTime?: number;
  onWordClick?: (time: number) => void;
  className?: string;
}

export const TranscriptionText: React.FC<TranscriptionTextProps> = ({
  text,
  currentTime = 0,
  onWordClick,
  className = ''
}) => {
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const { toast } = useToast();

  // Simple word-time mapping (in a real implementation, this would come from the transcription service)
  const words = text ? text.split(' ') : [];
  const wordsPerSecond = 3; // Average speaking rate
  
  useEffect(() => {
    // Calculate which word should be highlighted based on current time
    const wordIndex = Math.floor(currentTime * wordsPerSecond);
    setHighlightedWordIndex(Math.min(wordIndex, words.length - 1));
  }, [currentTime, words.length]);

  const handleWordClick = (wordIndex: number) => {
    // Calculate approximate time for the word
    const time = wordIndex / wordsPerSecond;
    onWordClick?.(time);
  };

  const copyToClipboard = async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Texto copiado',
        description: 'A transcrição foi copiada para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      });
    }
  };

  const downloadTranscription = () => {
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcricao.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!text) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Nenhuma transcrição disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-normal">Transcrição</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTranscription}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Baixar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="prose prose-sm max-w-none">
          <p className="leading-relaxed text-foreground">
            {words.map((word, index) => (
              <span
                key={index}
                className={`cursor-pointer transition-colors duration-200 ${
                  index === highlightedWordIndex
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'hover:bg-muted'
                } px-0.5 rounded`}
                onClick={() => handleWordClick(index)}
                title="Clique para pular para este momento"
              >
                {word}{' '}
              </span>
            ))}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Palavras: {words.length}</span>
            <span>Tempo estimado: {Math.ceil(words.length / wordsPerSecond / 60)} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
