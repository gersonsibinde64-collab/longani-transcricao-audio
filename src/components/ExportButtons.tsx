
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  FileImage, 
  Download,
  Video
} from 'lucide-react';
import { ExportUtils, ExportOptions } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  title: string;
  content: string;
  metadata?: {
    duration?: number;
    wordCount?: number;
    accuracy?: number;
    createdAt?: string;
  };
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  title,
  content,
  metadata,
  className = ''
}) => {
  const { toast } = useToast();

  const handleExport = async (format: 'txt' | 'docx' | 'pdf' | 'srt') => {
    if (!content || !content.trim()) {
      toast({
        title: 'Erro na exportação',
        description: 'Não há conteúdo para exportar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const exportOptions: ExportOptions = {
        title: title || 'Transcrição',
        content,
        metadata,
      };

      switch (format) {
        case 'txt':
          await ExportUtils.exportAsTxt(exportOptions);
          break;
        case 'docx':
          await ExportUtils.exportAsDocx(exportOptions);
          break;
        case 'pdf':
          await ExportUtils.exportAsPdf(exportOptions);
          break;
        case 'srt':
          await ExportUtils.exportAsSrt(exportOptions);
          break;
      }

      toast({
        title: 'Exportação concluída',
        description: `Arquivo ${format.toUpperCase()} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro durante exportação:', error);
      toast({
        title: 'Erro na exportação',
        description: `Não foi possível exportar como ${format.toUpperCase()}.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('txt')}
        className="h-8"
        title="Exportar como texto simples"
      >
        <FileText className="w-3 h-3 mr-1" />
        TXT
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('docx')}
        className="h-8"
        title="Exportar como documento Word"
      >
        <FileImage className="w-3 h-3 mr-1" />
        DOCX
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        className="h-8"
        title="Exportar como PDF"
      >
        <Download className="w-3 h-3 mr-1" />
        PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('srt')}
        className="h-8"
        title="Exportar como legenda SRT"
      >
        <Video className="w-3 h-3 mr-1" />
        SRT
      </Button>
    </div>
  );
};
