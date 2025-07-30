
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
}

export class TranscriptionService {
  static async getUserTranscriptions() {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  static async getTranscriptionById(id: string) {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async updateTranscription(id: string, updates: Partial<TranscriptionData>) {
    const { data, error } = await supabase
      .from('transcriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async deleteTranscription(id: string) {
    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  static async createTranscription(data: Omit<TranscriptionData, 'id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: transcription, error } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return transcription;
  }
}
