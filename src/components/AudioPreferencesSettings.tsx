
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, RotateCcw } from 'lucide-react';
import { useAudioPreferences } from '@/hooks/useAudioPreferences';

interface AudioPreferencesSettingsProps {
  className?: string;
}

export const AudioPreferencesSettings: React.FC<AudioPreferencesSettingsProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences, resetPreferences } = useAudioPreferences();

  return (
    <Card className={`${className} bg-background border-border`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-light flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Preferências de Áudio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Auto Play */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-play" className="text-sm font-light">
            Reproduzir áudio automaticamente
          </Label>
          <Switch
            id="auto-play"
            checked={preferences.autoPlay}
            onCheckedChange={(checked) => updatePreferences({ autoPlay: checked })}
          />
        </div>

        {/* Visual Progress */}
        <div className="flex items-center justify-between">
          <Label htmlFor="visual-progress" className="text-sm font-light">
            Mostrar progresso visual
          </Label>
          <Switch
            id="visual-progress"
            checked={preferences.showVisualProgress}
            onCheckedChange={(checked) => updatePreferences({ showVisualProgress: checked })}
          />
        </div>

        {/* Reset Button */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={resetPreferences}
            className="w-full font-light"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar padrões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
