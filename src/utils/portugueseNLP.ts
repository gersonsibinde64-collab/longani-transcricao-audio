
// Portuguese European NLP processing utilities
export interface ProcessingOptions {
  dialect: 'pt-PT' | 'pt-MZ'; // Portuguese European or Mozambican
  enablePunctuation: boolean;
  enableFormatting: boolean;
  enableStructure: boolean;
}

export interface ProcessedTranscript {
  text: string;
  confidence: number;
  structure: {
    paragraphs: number;
    headings: number;
    lists: number;
    quotes: number;
  };
}

export class PortugueseProcessor {
  private titlePatterns = [
    /^(capítulo|secção|parte|título)\s+\w+/i,
    /^(introdução|conclusão|resumo|abstract)/i,
    /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]{2,30}$/
  ];

  private emphasisWords = [
    'muito', 'extremamente', 'absolutamente', 'completamente',
    'definitivamente', 'certamente', 'obviamente', 'claramente'
  ];

  private transitionWords = [
    'portanto', 'contudo', 'todavia', 'entretanto', 'assim',
    'consequentemente', 'por conseguinte', 'além disso',
    'por outro lado', 'em primeiro lugar', 'finalmente'
  ];

  private quoteIndicators = [
    'disse', 'afirmou', 'declarou', 'mencionou', 'referiu',
    'segundo', 'conforme', 'de acordo com', 'como disse'
  ];

  processTranscript(rawText: string, options: ProcessingOptions): ProcessedTranscript {
    let processedText = rawText;
    let confidence = 0.8; // Base confidence
    
    const structure = {
      paragraphs: 0,
      headings: 0,
      lists: 0,
      quotes: 0
    };

    // Apply Portuguese European specific processing
    if (options.enablePunctuation) {
      processedText = this.addPunctuation(processedText, options.dialect);
      confidence += 0.1;
    }

    if (options.enableStructure) {
      processedText = this.detectStructure(processedText, structure);
      confidence += 0.05;
    }

    if (options.enableFormatting) {
      processedText = this.applyFormatting(processedText, structure);
      confidence += 0.05;
    }

    return {
      text: processedText,
      confidence: Math.min(confidence, 1.0),
      structure
    };
  }

  private addPunctuation(text: string, dialect: 'pt-PT' | 'pt-MZ'): string {
    // European Portuguese punctuation rules
    let processed = text;

    // Add commas before subordinate clauses
    processed = processed.replace(/\s+(que|quando|onde|como|porque|se)\s+/g, ', $1 ');
    
    // European style comma usage (more liberal than Brazilian)
    processed = processed.replace(/\s+(mas|porém|contudo|todavia|entretanto)\s+/g, ', $1 ');
    
    // Add periods at sentence ends
    processed = processed.replace(/([a-z])\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1. $2');
    
    // Question marks for interrogative words
    processed = processed.replace(/\b(como|quando|onde|quem|que|porquê|quanto)\s+[^.!?]*$/gi, match => {
      return match.endsWith('?') ? match : match + '?';
    });

    // Exclamation marks for exclamatory expressions
    processed = processed.replace(/\b(que\s+(bom|mau|bonito|feio|interessante))\b/gi, '$1!');

    return processed;
  }

  private detectStructure(text: string, structure: any): string {
    let processed = text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let processedSentences: string[] = [];
    let currentParagraph: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Title detection
      if (this.isTitle(sentence)) {
        if (currentParagraph.length > 0) {
          processedSentences.push(currentParagraph.join('. ') + '.');
          currentParagraph = [];
          structure.paragraphs++;
        }
        
        if (sentence.length < 50 && this.titlePatterns.some(pattern => pattern.test(sentence))) {
          processedSentences.push(`# ${sentence}`);
          structure.headings++;
        } else {
          processedSentences.push(`## ${sentence}`);
          structure.headings++;
        }
        continue;
      }

      // List detection
      if (this.isList(sentence)) {
        if (currentParagraph.length > 0) {
          processedSentences.push(currentParagraph.join('. ') + '.');
          currentParagraph = [];
          structure.paragraphs++;
        }
        processedSentences.push(`• ${sentence}`);
        structure.lists++;
        continue;
      }

      // Quote detection
      if (this.isQuote(sentence)) {
        if (currentParagraph.length > 0) {
          processedSentences.push(currentParagraph.join('. ') + '.');
          currentParagraph = [];
          structure.paragraphs++;
        }
        processedSentences.push(`"${sentence}"`);
        structure.quotes++;
        continue;
      }

      // Regular sentence
      currentParagraph.push(sentence);

      // Paragraph break detection (topic change)
      if (this.isTopicChange(sentence, sentences[i + 1])) {
        processedSentences.push(currentParagraph.join('. ') + '.');
        processedSentences.push(''); // Empty line for paragraph break
        currentParagraph = [];
        structure.paragraphs++;
      }
    }

    // Add remaining paragraph
    if (currentParagraph.length > 0) {
      processedSentences.push(currentParagraph.join('. ') + '.');
      structure.paragraphs++;
    }

    return processedSentences.join('\n\n');
  }

  private applyFormatting(text: string, structure: any): string {
    let formatted = text;

    // Bold emphasis for strong words
    this.emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      formatted = formatted.replace(regex, `**${word}**`);
    });

    // Italic for transition words
    this.transitionWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      formatted = formatted.replace(regex, `*${word}*`);
    });

    return formatted;
  }

  private isTitle(sentence: string): boolean {
    return this.titlePatterns.some(pattern => pattern.test(sentence)) ||
           (sentence.length < 50 && sentence.split(' ').length <= 6);
  }

  private isList(sentence: string): boolean {
    return !!sentence.match(/^(primeiro|segundo|terceiro|em seguida|depois|finalmente|por último)/i) ||
           !!sentence.match(/^(a|b|c|d|e)\s+/) ||
           !!sentence.match(/^\d+\s+/);
  }

  private isQuote(sentence: string): boolean {
    return this.quoteIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private isTopicChange(current: string, next?: string): boolean {
    if (!next) return false;
    
    return this.transitionWords.some(word => 
      next.toLowerCase().startsWith(word.toLowerCase())
    );
  }
}

export const portugueseProcessor = new PortugueseProcessor();
