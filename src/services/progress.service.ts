import { supabase } from '../lib/supabase';
import type { UserProgress, InsertUserProgress, ApiResponse, UserProgressWithTitle } from '../types/database.type';

export const progressService = {
  // Update user progress for a title
  updateProgress: async (
    userId: string,
    titleId: string,
    currentChapter: number,
    totalChapters: number
  ): Promise<ApiResponse<UserProgress>> => {
    try {
      const progressPercentage = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;
      
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          title_id: titleId,
          current_chapter: currentChapter,
          total_chapters: totalChapters,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,title_id'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Progress updated successfully' 
      };
    } catch (error) {
      console.error('Update progress error:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  },

  // Get user progress for a specific title
  getProgressByTitle: async (userId: string, titleId: string): Promise<ApiResponse<UserProgress>> => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('title_id', titleId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get progress by title error:', error);
      return { success: false, error: 'Failed to fetch progress' };
    }
  },

  // Get all user progress with title information
  getUserProgress: async (userId: string): Promise<ApiResponse<UserProgressWithTitle[]>> => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          titles(id, name, coverImage)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user progress error:', error);
      return { success: false, error: 'Failed to fetch user progress' };
    }
  },

  // Get user progress statistics
  getUserProgressStats: async (userId: string): Promise<ApiResponse<{
    totalTitles: number;
    completedTitles: number;
    inProgressTitles: number;
    averageProgress: number;
  }>> => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('progress_percentage')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const progresses = data || [];
      const totalTitles = progresses.length;
      const completedTitles = progresses.filter(p => p.progress_percentage === 100).length;
      const inProgressTitles = progresses.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length;
      const averageProgress = totalTitles > 0 
        ? Math.round(progresses.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalTitles)
        : 0;

      return {
        success: true,
        data: {
          totalTitles,
          completedTitles,
          inProgressTitles,
          averageProgress
        }
      };
    } catch (error) {
      console.error('Get user progress stats error:', error);
      return { success: false, error: 'Failed to fetch progress statistics' };
    }
  },

  // Delete progress for a title
  deleteProgress: async (userId: string, titleId: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
        .eq('title_id', titleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Progress deleted successfully' 
      };
    } catch (error) {
      console.error('Delete progress error:', error);
      return { success: false, error: 'Failed to delete progress' };
    }
  },

  // Reset progress for a title (set to chapter 1)
  resetProgress: async (userId: string, titleId: string): Promise<ApiResponse<UserProgress>> => {
    try {
      // First get the total chapters for this title
      const { count: totalChapters, error: countError } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('title_id', titleId);

      if (countError) {
        return { success: false, error: countError.message };
      }

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          title_id: titleId,
          current_chapter: 1,
          total_chapters: totalChapters || 0,
          progress_percentage: totalChapters && totalChapters > 0 ? Math.round((1 / totalChapters) * 100) : 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,title_id'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Progress reset successfully' 
      };
    } catch (error) {
      console.error('Reset progress error:', error);
      return { success: false, error: 'Failed to reset progress' };
    }
  },
};