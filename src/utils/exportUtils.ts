
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export interface ExportOptions {
  title: string;
  content: string;
  metadata?: {
    duration?: number;
    wordCount?: number;
    accuracy?: number;
    createdAt?: string;
  };
}

export class ExportUtils {
  static async exportAsMarkdown(options: ExportOptions): Promise<void> {
    const { title, content, metadata } = options;
    
    let markdownContent = `# ${title}\n\n`;
    
    // Add metadata section
    if (metadata) {
      markdownContent += '## Informações da Transcrição\n\n';
      
      if (metadata.createdAt) {
        markdownContent += `**Data:** ${metadata.createdAt}\n\n`;
      }
      if (metadata.duration) {
        const minutes = Math.floor(metadata.duration / 60);
        const seconds = metadata.duration % 60;
        markdownContent += `**Duração:** ${minutes}:${seconds.toString().padStart(2, '0')}\n\n`;
      }
      if (metadata.wordCount) {
        markdownContent += `**Palavras:** ${metadata.wordCount}\n\n`;
      }
      if (metadata.accuracy) {
        markdownContent += `**Precisão:** ${metadata.accuracy.toFixed(1)}%\n\n`;
      }
      
      markdownContent += '---\n\n';
    }
    
    // Add transcribed content
    markdownContent += '## Transcrição\n\n';
    
    // Ensure we have actual content
    if (!content || content.trim() === '') {
      markdownContent += '*Não foi possível extrair texto do áudio. Verifique se o arquivo de áudio é válido e tente novamente.*\n\n';
    } else {
      // Clean and structure the content
      const cleanContent = this.cleanAndStructureContent(content);
      markdownContent += cleanContent;
    }
    
    // Add footer
    markdownContent += '\n\n---\n\n*Transcrição gerada automaticamente usando Whisper AI*';
    
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    this.downloadFile(blob, `${title}.md`);
  }

  static async exportAsTxt(options: ExportOptions): Promise<void> {
    const { title, content, metadata } = options;
    
    let textContent = `${title}\n${'='.repeat(title.length)}\n\n`;
    
    if (metadata) {
      textContent += 'INFORMAÇÕES DA TRANSCRIÇÃO\n';
      textContent += '-'.repeat(25) + '\n';
      if (metadata.createdAt) textContent += `Data: ${metadata.createdAt}\n`;
      if (metadata.duration) {
        const minutes = Math.floor(metadata.duration / 60);
        const seconds = metadata.duration % 60;
        textContent += `Duração: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
      }
      if (metadata.wordCount) textContent += `Palavras: ${metadata.wordCount}\n`;
      if (metadata.accuracy) textContent += `Precisão: ${metadata.accuracy.toFixed(1)}%\n`;
      textContent += '\n';
    }
    
    textContent += 'TRANSCRIÇÃO\n';
    textContent += '-'.repeat(11) + '\n\n';
    
    if (!content || content.trim() === '') {
      textContent += 'Não foi possível extrair texto do áudio. Verifique se o arquivo de áudio é válido e tente novamente.\n';
    } else {
      // Remove HTML tags and structure content
      const plainText = content.replace(/<[^>]*>/g, '');
      const structuredText = this.cleanAndStructureContent(plainText);
      textContent += structuredText;
    }
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    this.downloadFile(blob, `${title}.txt`);
  }

  static async exportAsDocx(options: ExportOptions): Promise<void> {
    const { title, content, metadata } = options;
    
    const children: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
          }),
        ],
      }),
      new Paragraph({ text: '' }) // Empty line
    ];

    if (metadata) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'INFORMAÇÕES DA TRANSCRIÇÃO',
              bold: true,
              size: 24,
            }),
          ],
        })
      );

      if (metadata.createdAt) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Data: ', bold: true }),
              new TextRun({ text: metadata.createdAt }),
            ],
          })
        );
      }

      if (metadata.duration) {
        const minutes = Math.floor(metadata.duration / 60);
        const seconds = metadata.duration % 60;
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Duração: ', bold: true }),
              new TextRun({ text: `${minutes}:${seconds.toString().padStart(2, '0')}` }),
            ],
          })
        );
      }

      if (metadata.wordCount) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Palavras: ', bold: true }),
              new TextRun({ text: metadata.wordCount.toString() }),
            ],
          })
        );
      }

      if (metadata.accuracy) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Precisão: ', bold: true }),
              new TextRun({ text: `${metadata.accuracy.toFixed(1)}%` }),
            ],
          })
        );
      }

      children.push(
        new Paragraph({ text: '' }), // Empty line
        new Paragraph({
          children: [
            new TextRun({
              text: 'TRANSCRIÇÃO',
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({ text: '' }) // Empty line
      );
    }

    // Add content
    if (!content || content.trim() === '') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Não foi possível extrair texto do áudio. Verifique se o arquivo de áudio é válido e tente novamente.',
              italics: true,
              size: 24,
            }),
          ],
        })
      );
    } else {
      const plainText = content.replace(/<[^>]*>/g, '');
      const structuredText = this.cleanAndStructureContent(plainText);
      const paragraphs = structuredText.split('\n\n').filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: 24,
              }),
            ],
          })
        );
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    this.downloadFile(blob, `${title}.docx`);
  }

  static async exportAsPdf(options: ExportOptions): Promise<void> {
    const { title, content, metadata } = options;
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPosition);
    yPosition += 15;
    
    // Metadata section
    if (metadata) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMAÇÕES DA TRANSCRIÇÃO', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (metadata.createdAt) {
        doc.text(`Data: ${metadata.createdAt}`, 20, yPosition);
        yPosition += 6;
      }
      
      if (metadata.duration) {
        const minutes = Math.floor(metadata.duration / 60);
        const seconds = metadata.duration % 60;
        doc.text(`Duração: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, yPosition);
        yPosition += 6;
      }
      
      if (metadata.wordCount) {
        doc.text(`Palavras: ${metadata.wordCount}`, 20, yPosition);
        yPosition += 6;
      }
      
      if (metadata.accuracy) {
        doc.text(`Precisão: ${metadata.accuracy.toFixed(1)}%`, 20, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
      
      // Transcription header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSCRIÇÃO', 20, yPosition);
      yPosition += 10;
    }
    
    // Content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (!content || content.trim() === '') {
      const errorText = 'Não foi possível extrair texto do áudio. Verifique se o arquivo de áudio é válido e tente novamente.';
      const lines = doc.splitTextToSize(errorText, 170);
      
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    } else {
      const plainText = content.replace(/<[^>]*>/g, '');
      const structuredText = this.cleanAndStructureContent(plainText);
      const lines = doc.splitTextToSize(structuredText, 170);
      
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    }
    
    doc.save(`${title}.pdf`);
  }

  static async exportAsSrt(options: ExportOptions): Promise<void> {
    const { title, content } = options;
    
    if (!content || content.trim() === '') {
      // Create a basic SRT with error message
      const srtContent = `1\n00:00:00,000 --> 00:00:05,000\nNão foi possível extrair texto do áudio.\n\n2\n00:00:05,000 --> 00:00:10,000\nVerifique se o arquivo é válido e tente novamente.\n\n`;
      
      const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      this.downloadFile(blob, `${title}.srt`);
      return;
    }
    
    // Parse content to extract timestamps and text
    let srtContent = '';
    let counter = 1;
    
    // Look for timestamp patterns in the content
    const timestampRegex = /## Parte \d+ \((\d+):(\d+)\)/g;
    const segments = content.split(timestampRegex);
    
    if (segments.length > 3) {
      // Content has parts with timestamps
      for (let i = 1; i < segments.length; i += 3) {
        const minutes = parseInt(segments[i]);
        const seconds = parseInt(segments[i + 1]);
        const text = segments[i + 2]?.trim();
        
        if (text && text.length > 0) {
          const startTime = this.formatSrtTime(minutes * 60 + seconds);
          const endTime = this.formatSrtTime(minutes * 60 + seconds + 30); // 30 seconds duration
          
          const cleanText = text.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
          
          if (cleanText && cleanText !== '[Sem conteúdo transcrito]') {
            srtContent += `${counter}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${cleanText}\n\n`;
            counter++;
          }
        }
      }
    } else {
      // No parts, create generic segments
      const plainText = content.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ');
      const words = plainText.split(' ').filter(word => word.trim());
      const wordsPerSegment = 15;
      const secondsPerSegment = 5;
      
      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segmentWords = words.slice(i, i + wordsPerSegment);
        const startSeconds = Math.floor((i / wordsPerSegment) * secondsPerSegment);
        const endSeconds = Math.floor(((i + wordsPerSegment) / wordsPerSegment) * secondsPerSegment);
        
        const startTime = this.formatSrtTime(startSeconds);
        const endTime = this.formatSrtTime(endSeconds);
        
        srtContent += `${counter}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${segmentWords.join(' ')}\n\n`;
        
        counter++;
      }
    }
    
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    this.downloadFile(blob, `${title}.srt`);
  }

  private static cleanAndStructureContent(content: string): string {
    if (!content || content.trim() === '') {
      return 'Não foi possível extrair conteúdo do áudio.';
    }

    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>/g, '');
    
    // Fix spacing
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Ensure proper paragraph breaks
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    // Ensure it ends with punctuation
    if (!cleaned.trim().match(/[.!?]$/)) {
      cleaned = cleaned.trim() + '.';
    }
    
    return cleaned.trim();
  }

  private static formatSrtTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},000`;
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
