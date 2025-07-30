
import { useState, useCallback, useEffect } from 'react';

export interface AudioPreferences {
  muteByDefault: boolean;
  autoPlay: boolean;
  showVisualProgress: boolean;
  volume: number;
}

const DEFAULT_PREFERENCES: AudioPreferences = {
  muteByDefault: true,
  autoPlay: false,
  showVisualProgress: true,
  volume: 0.7,
};

export const useAudioPreferences = () => {
  const [preferences, setPreferences] = useState<AudioPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('audioPreferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
  }, []);

  // Save preferences to sessionStorage
  const updatePreferences = useCallback((updates: Partial<AudioPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      sessionStorage.setItem('audioPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save audio preferences:', error);
    }
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      sessionStorage.removeItem('audioPreferences');
    } catch (error) {
      console.warn('Failed to clear audio preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
};
