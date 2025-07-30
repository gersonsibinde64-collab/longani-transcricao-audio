
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Languages, FileText, Sparkles } from 'lucide-react';

interface IntelligentSettings {
  dialect: 'pt-PT' | 'pt-MZ';
  enableIntelligentFormatting: boolean;
  enableStructureDetection: boolean;
  enablePunctuationRestoration: boolean;
}

interface IntelligentTranscriptionSettingsProps {
  settings: IntelligentSettings;
  onSettingsChange: (settings: IntelligentSettings) => void;
}

export const IntelligentTranscriptionSettings: React.FC<IntelligentTranscriptionSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const updateSetting = <K extends keyof IntelligentSettings>(key: K, value: IntelligentSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          Transcrição Inteligente
          <Badge variant="secondary" className="text-xs">
            Português Europeu
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Dialect */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Languages className="w-4 h-4" />
            Dialeto do Português
          </Label>
          <Select
            value={settings.dialect}
            onValueChange={(value: 'pt-PT' | 'pt-MZ') => updateSetting('dialect', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-PT">
                🇵🇹 Português Europeu (Portugal)
              </SelectItem>
              <SelectItem value="pt-MZ">
                🇲🇿 Português Moçambicano
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Otimizado para expressões e gramática específicas do dialeto
          </p>
        </div>

        {/* Punctuation Restoration */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Restauração de Pontuação
            </Label>
            <p className="text-xs text-muted-foreground">
              Adiciona vírgulas, pontos e pontuação automática
            </p>
          </div>
          <Switch
            checked={settings.enablePunctuationRestoration}
            onCheckedChange={(checked) => updateSetting('enablePunctuationRestoration', checked)}
          />
        </div>

        {/* Structure Detection */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Detecção de Estrutura
            </Label>
            <p className="text-xs text-muted-foreground">
              Identifica títulos, parágrafos, listas e citações
            </p>
          </div>
          <Switch
            checked={settings.enableStructureDetection}
            onCheckedChange={(checked) => updateSetting('enableStructureDetection', checked)}
          />
        </div>

        {/* Intelligent Formatting */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Formatação Inteligente
            </Label>
            <p className="text-xs text-muted-foreground">
              Aplica negrito, itálico e formatação markdown
            </p>
          </div>
          <Switch
            checked={settings.enableIntelligentFormatting}
            onCheckedChange={(checked) => updateSetting('enableIntelligentFormatting', checked)}
          />
        </div>

        {/* Features Preview */}
        <div className="mt-6 p-4 bg-accent/20 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Funcionalidades Ativas:</h4>
          <div className="flex flex-wrap gap-2">
            {settings.enablePunctuationRestoration && (
              <Badge variant="outline" className="text-xs">
                Pontuação Automática
              </Badge>
            )}
            {settings.enableStructureDetection && (
              <Badge variant="outline" className="text-xs">
                Estrutura de Documento
              </Badge>
            )}
            {settings.enableIntelligentFormatting && (
              <Badge variant="outline" className="text-xs">
                Formatação Markdown
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {settings.dialect === 'pt-PT' ? 'Português Europeu' : 'Português Moçambicano'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
