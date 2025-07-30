
import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline,
  Save,
  Download,
  FileText,
  FileImage,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionService } from '@/utils/transcriptionService';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface RichTextEditorProps {
  transcriptionId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onTimestampClick?: (time: number) => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  transcriptionId,
  initialContent = '',
  onContentChange,
  onTimestampClick,
  className = ''
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a editar sua transcrição...',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onContentChange?.(content);
      // Auto-save after 2 seconds of inactivity
      debouncedSave(content);
    },
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      await saveContent(content);
    }, 2000),
    [transcriptionId]
  );

  const saveContent = async (content?: string) => {
    if (!editor) return;
    
    setIsSaving(true);
    const textContent = content || editor.getHTML();
    
    try {
      await TranscriptionService.updateTranscription(transcriptionId, {
        transcribed_text: textContent
      });
      setLastSaved(new Date());
      toast({
        title: 'Salvo automaticamente',
        description: 'Suas alterações foram salvas.',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = () => {
    saveContent();
  };

  const exportAsTxt = () => {
    if (!editor) return;
    
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${transcriptionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    if (!editor) return;
    
    const text = editor.getText();
    const doc = new jsPDF();
    
    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(text, 180);
    let yPosition = 20;
    
    doc.setFontSize(16);
    doc.text('Transcrição', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    doc.save(`transcricao-${transcriptionId}.pdf`);
  };

  const exportAsDocx = async () => {
    if (!editor) return;
    
    const text = editor.getText();
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Transcrição',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${transcriptionId}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addTimestamp = () => {
    if (!editor) return;
    
    const currentTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    editor.chain().focus().insertContent(`[${currentTime}] `).run();
  };

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return <div>Carregando editor...</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-normal">Editor de Transcrição</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" />
                Salvando...
              </span>
            ) : lastSaved ? (
              <span>Salvo às {lastSaved.toLocaleTimeString('pt-BR')}</span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 ${editor.isActive('bold') ? 'bg-primary/20' : ''}`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 ${editor.isActive('italic') ? 'bg-primary/20' : ''}`}
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={addTimestamp}
            className="h-8"
            title="Adicionar timestamp"
          >
            <Clock className="w-4 h-4" />
          </Button>
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
            className="h-8"
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar
          </Button>
        </div>

        {/* Editor */}
        <div className="min-h-[300px] border rounded-md">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none p-4 focus-within:outline-none"
          />
        </div>

        {/* Export Options */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Exportar como:</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsTxt}
              className="h-8"
            >
              <FileText className="w-3 h-3 mr-1" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsDocx}
              className="h-8"
            >
              <FileImage className="w-3 h-3 mr-1" />
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPdf}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
