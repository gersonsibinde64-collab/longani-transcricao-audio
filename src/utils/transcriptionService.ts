
import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionData {
  id?: string;
  title: string;
  file_name: string;
  file_size: number;
  language: string;
  status: 'processing' | 'completed' | 'failed';
  transcribed_text?: string;
  accuracy_score?: number;
  word_count?: number;
  duration_seconds?: number;
  error_message?: string;
  audio_file_url?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class TranscriptionService {
  static async getUserTranscriptions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transcriptions:', error);
        throw new Error(`Failed to fetch transcriptions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTranscriptions:', error);
      throw error;
    }
  }

  static async getTranscriptionById(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Transcription not found or access denied');
        }
        console.error('Error fetching transcription:', error);
        throw new Error(`Failed to fetch transcription: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getTranscriptionById:', error);
      throw error;
    }
  }

  static async updateTranscription(id: string, updates: Partial<TranscriptionData>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Remove fields that shouldn't be updated directly
      const { user_id, id: updateId, created_at, ...safeUpdates } = updates;

      const { data, error } = await supabase
        .from('transcriptions')
        .update(safeUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transcription:', error);
        throw new Error(`Failed to update transcription: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateTranscription:', error);
      throw error;
    }
  }

  static async deleteTranscription(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First check if transcription exists and belongs to user
      const { data: transcription } = await supabase
        .from('transcriptions')
        .select('audio_file_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!transcription) {
        throw new Error('Transcription not found or access denied');
      }

      // Delete associated audio file from storage if it exists
      if (transcription.audio_file_url) {
        try {
          const audioPath = transcription.audio_file_url.split('/').pop();
          if (audioPath) {
            const { error: storageError } = await supabase.storage
              .from('audio-files')
              .remove([`${user.id}/${audioPath}`]);
            
            if (storageError) {
              console.warn('Failed to delete audio file from storage:', storageError);
            }
          }
        } catch (storageError) {
          console.warn('Error deleting audio file:', storageError);
        }
      }

      // Delete transcription record
      const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting transcription:', error);
        throw new Error(`Failed to delete transcription: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTranscription:', error);
      throw error;
    }
  }

  static async createTranscription(data: Omit<TranscriptionData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const transcriptionData = {
        user_id: user.id,
        title: data.title || 'Untitled Transcription',
        file_name: data.file_name,
        file_size: data.file_size,
        language: data.language || 'pt-BR',
        status: data.status || 'processing',
        transcribed_text: data.transcribed_text || null,
        accuracy_score: data.accuracy_score || null,
        word_count: data.word_count || null,
        duration_seconds: data.duration_seconds || null,
        error_message: data.error_message || null,
        audio_file_url: data.audio_file_url || null
      };

      const { data: transcription, error } = await supabase
        .from('transcriptions')
        .insert(transcriptionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating transcription:', error);
        throw new Error(`Failed to create transcription: ${error.message}`);
      }

      return transcription;
    } catch (error) {
      console.error('Error in createTranscription:', error);
      throw error;
    }
  }

  static async uploadAudioFile(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading audio file:', error);
        throw new Error(`Failed to upload audio file: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadAudioFile:', error);
      throw error;
    }
  }
}
