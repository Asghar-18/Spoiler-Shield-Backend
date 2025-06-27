import { supabase } from '../lib/supabase';
import type { Question, InsertQuestion, ApiResponse, QuestionWithTitle } from '../types/database.type';

export const questionsService = {
  // Create a new question
  createQuestion: async (questionData: {
    user_id: string;
    title_id: string;
    question_text: string;
    chapter_limit: number;
  }): Promise<ApiResponse<Question>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          ...questionData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Question created successfully' 
      };
    } catch (error) {
      console.error('Create question error:', error);
      return { success: false, error: 'Failed to create question' };
    }
  },

  // Get user's questions with optional title filter
  getUserQuestions: async (userId: string, titleId?: string): Promise<ApiResponse<QuestionWithTitle[]>> => {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (titleId) {
        query = query.eq('title_id', titleId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user questions error:', error);
      return { success: false, error: 'Failed to fetch user questions' };
    }
  },

  // Get a single question by ID
  getQuestionById: async (questionId: string): Promise<ApiResponse<QuestionWithTitle>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('id', questionId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get question by ID error:', error);
      return { success: false, error: 'Failed to fetch question' };
    }
  },

  // Update question with AI answer
  updateQuestionAnswer: async (questionId: string, answerText: string): Promise<ApiResponse<Question>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          answer_text: answerText,
          status: 'answered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Question answered successfully' 
      };
    } catch (error) {
      console.error('Update question answer error:', error);
      return { success: false, error: 'Failed to update question answer' };
    }
  },

  // Update question status
  updateQuestionStatus: async (
    questionId: string, 
    status: 'pending' | 'answered' | 'failed'
  ): Promise<ApiResponse<Question>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Question status updated successfully' 
      };
    } catch (error) {
      console.error('Update question status error:', error);
      return { success: false, error: 'Failed to update question status' };
    }
  },

  // Delete a question
  deleteQuestion: async (questionId: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Question deleted successfully' 
      };
    } catch (error) {
      console.error('Delete question error:', error);
      return { success: false, error: 'Failed to delete question' };
    }
  },

  // Get questions by status
  getQuestionsByStatus: async (
    userId: string, 
    status: 'pending' | 'answered' | 'failed'
  ): Promise<ApiResponse<QuestionWithTitle[]>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get questions by status error:', error);
      return { success: false, error: 'Failed to fetch questions by status' };
    }
  },

  // Get recent questions (last N days)
  getRecentQuestions: async (userId: string, days: number = 7): Promise<ApiResponse<QuestionWithTitle[]>> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get recent questions error:', error);
      return { success: false, error: 'Failed to fetch recent questions' };
    }
  },

  // Get questions by title ID
  getQuestionsByTitle: async (userId: string, titleId: string): Promise<ApiResponse<QuestionWithTitle[]>> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('user_id', userId)
        .eq('title_id', titleId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get questions by title error:', error);
      return { success: false, error: 'Failed to fetch questions by title' };
    }
  },
};