
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from './RichTextEditor';
import { ExportButtons } from './ExportButtons';

interface TranscriptionTextProps {
  text?: string;
  transcriptionId?: string;
  currentTime?: number;
  onWordClick?: (time: number) => void;
  onTimestampClick?: (time: number) => void;
  className?: string;
  metadata?: {
    title?: string;
    duration?: number;
    wordCount?: number;
    accuracy?: number;
    createdAt?: string;
  };
}

export const TranscriptionText: React.FC<TranscriptionTextProps> = ({
  text,
  transcriptionId,
  currentTime = 0,
  onWordClick,
  onTimestampClick,
  className = '',
  metadata
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text || '');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const { toast } = useToast();

  // Simple word-time mapping (in a real implementation, this would come from the transcription service)
  const words = editedText ? editedText.replace(/<[^>]*>/g, '').split(' ') : [];
  const wordsPerSecond = 3; // Average speaking rate
  
  useEffect(() => {
    // Calculate which word should be highlighted based on current time
    const wordIndex = Math.floor(currentTime * wordsPerSecond);
    setHighlightedWordIndex(Math.min(wordIndex, words.length - 1));
  }, [currentTime, words.length]);

  useEffect(() => {
    setEditedText(text || '');
  }, [text]);

  const handleWordClick = (wordIndex: number) => {
    // Calculate approximate time for the word
    const time = wordIndex / wordsPerSecond;
    onWordClick?.(time);
  };

  const handleTimestampClick = (timestampText: string) => {
    // Extract time from timestamp format [HH:MM:SS]
    const timeMatch = timestampText.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      onTimestampClick?.(totalSeconds);
    }
  };

  const copyToClipboard = async () => {
    if (!editedText) return;
    
    try {
      // Remove HTML tags for plain text copy
      const plainText = editedText.replace(/<[^>]*>/g, '');
      await navigator.clipboard.writeText(plainText);
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

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleContentChange = (content: string) => {
    setEditedText(content);
  };

  if (!text && !editedText) {
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

  const exportTitle = metadata?.title || (transcriptionId ? `Transcrição ${transcriptionId}` : 'Transcrição');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-normal">
            {isEditing ? 'Editando Transcrição' : 'Transcrição'}
          </CardTitle>
          <div className="flex gap-2">
            {transcriptionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEditMode}
                className="h-8"
              >
                {isEditing ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Visualizar
                  </>
                ) : (
                  <>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isEditing && transcriptionId ? (
          <RichTextEditor
            transcriptionId={transcriptionId}
            initialContent={editedText}
            onContentChange={handleContentChange}
            onTimestampClick={onTimestampClick}
            metadata={metadata}
          />
        ) : (
          <>
            <div className="prose prose-sm max-w-none">
              <p className="leading-relaxed text-foreground">
                {editedText.includes('<') ? (
                  // Render HTML content with timestamp click handling
                  <span
                    dangerouslySetInnerHTML={{ __html: editedText }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      const timestampMatch = target.textContent?.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
                      if (timestampMatch) {
                        handleTimestampClick(target.textContent!);
                      }
                    }}
                    className="cursor-pointer"
                  />
                ) : (
                  // Render plain text with word highlighting
                  words.map((word, index) => (
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
                  ))
                )}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span>Palavras: {words.length}</span>
                    <span>Tempo estimado: {Math.ceil(words.length / 3 / 60)} min</span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Exportar:</span>
                <ExportButtons
                  title={exportTitle}
                  content={editedText}
                  metadata={metadata}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
