
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Play, Pause } from 'lucide-react';
import { useAudioPreferences } from '@/hooks/useAudioPreferences';

interface AudioControlsProps {
  audioUrl: string | null;
  isTranscribing: boolean;
  onAudioStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  audioUrl,
  isTranscribing,
  onAudioStateChange,
  className = ''
}) => {
  const { preferences, updatePreferences } = useAudioPreferences();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element when URL changes
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = preferences.volume;

      // Set up event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
      });

      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      // Auto-play if preference is set
      if (preferences.autoPlay) {
        audioRef.current.play().catch(console.error);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', () => {});
        audioRef.current.removeEventListener('timeupdate', () => {});
        audioRef.current.removeEventListener('ended', () => {});
        audioRef.current.removeEventListener('play', () => {});
        audioRef.current.removeEventListener('pause', () => {});
        audioRef.current = null;
      }
    };
  }, [audioUrl, preferences.autoPlay, preferences.volume]);

  // Update parent component when audio state changes
  useEffect(() => {
    onAudioStateChange?.(isPlaying);
  }, [isPlaying, onAudioStateChange]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const volume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    updatePreferences({ volume });
  }, [updatePreferences]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!audioUrl) return null;

  return (
    <Card className={`${className} bg-background border-border`}>
      <CardContent className="p-4 space-y-4">
        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!audioRef.current}
            className="w-full"
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[preferences.volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1 max-w-32"
          />
          <span className="text-xs text-muted-foreground w-8">
            {Math.round(preferences.volume * 100)}%
          </span>
        </div>

        {/* Transcription Status */}
        {isTranscribing && (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              🎯 Transcrevendo...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
