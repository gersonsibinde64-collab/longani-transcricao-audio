
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
  static async exportAsTxt(options: ExportOptions): Promise<void> {
    const { title, content, metadata } = options;
    
    let textContent = `${title}\n\n`;
    
    if (metadata) {
      textContent += '--- METADADOS ---\n';
      if (metadata.createdAt) textContent += `Data: ${metadata.createdAt}\n`;
      if (metadata.duration) textContent += `Duração: ${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}\n`;
      if (metadata.wordCount) textContent += `Palavras: ${metadata.wordCount}\n`;
      if (metadata.accuracy) textContent += `Precisão: ${metadata.accuracy}%\n`;
      textContent += '\n--- TRANSCRIÇÃO ---\n\n';
    }
    
    // Remove HTML tags for plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    textContent += plainText;
    
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
              text: 'METADADOS',
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
              new TextRun({ text: `${metadata.accuracy}%` }),
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

    // Remove HTML tags and add content
    const plainText = content.replace(/<[^>]*>/g, '');
    const paragraphs = plainText.split('\n').filter(p => p.trim());
    
    paragraphs.forEach(paragraph => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph,
              size: 24,
            }),
          ],
        })
      );
    });

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
      doc.text('METADADOS', 20, yPosition);
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
        doc.text(`Precisão: ${metadata.accuracy}%`, 20, yPosition);
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
    
    const plainText = content.replace(/<[^>]*>/g, '');
    const lines = doc.splitTextToSize(plainText, 170);
    
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
    
    doc.save(`${title}.pdf`);
  }

  static async exportAsSrt(options: ExportOptions): Promise<void> {
    const { title, content } = options;
    
    // Parse content to extract timestamps and text
    let srtContent = '';
    let counter = 1;
    
    // Look for timestamp patterns in the content
    const timestampRegex = /\[(\d{2}):(\d{2}):(\d{2})\]/g;
    const segments = content.split(timestampRegex);
    
    if (segments.length > 1) {
      // Content has timestamps
      for (let i = 1; i < segments.length; i += 4) {
        const hours = segments[i];
        const minutes = segments[i + 1];
        const seconds = segments[i + 2];
        const text = segments[i + 3]?.trim();
        
        if (text && text.length > 0) {
          const startTime = `${hours}:${minutes}:${seconds},000`;
          
          // Calculate end time (add 3 seconds or until next timestamp)
          let endHours = hours;
          let endMinutes = minutes;
          let endSeconds = (parseInt(seconds) + 3).toString().padStart(2, '0');
          
          if (parseInt(endSeconds) >= 60) {
            endSeconds = ((parseInt(endSeconds)) % 60).toString().padStart(2, '0');
            endMinutes = (parseInt(minutes) + 1).toString().padStart(2, '0');
            if (parseInt(endMinutes) >= 60) {
              endMinutes = ((parseInt(endMinutes)) % 60).toString().padStart(2, '0');
              endHours = (parseInt(hours) + 1).toString().padStart(2, '0');
            }
          }
          
          const endTime = `${endHours}:${endMinutes}:${endSeconds},000`;
          
          srtContent += `${counter}\n`;
          srtContent += `${startTime} --> ${endTime}\n`;
          srtContent += `${text.replace(/<[^>]*>/g, '').trim()}\n\n`;
          
          counter++;
        }
      }
    } else {
      // No timestamps, create generic segments
      const plainText = content.replace(/<[^>]*>/g, '');
      const words = plainText.split(' ').filter(word => word.trim());
      const wordsPerSegment = 10;
      const secondsPerSegment = 4;
      
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
