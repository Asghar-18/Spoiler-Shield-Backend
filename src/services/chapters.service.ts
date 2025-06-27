import { supabase } from '../lib/supabase';
import type { Chapter, InsertChapter, ApiResponse } from '../types/database.type';

export const chaptersService = {
  // Get all chapters for a specific title
  getChaptersByTitle: async (titleId: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('title_id', titleId)
        .order('order', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get chapters by title error:', error);
      return { success: false, error: 'Failed to fetch chapters' };
    }
  },

  // Get a single chapter by ID
  getChapterById: async (chapterId: string): Promise<ApiResponse<Chapter>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get chapter by ID error:', error);
      return { success: false, error: 'Failed to fetch chapter' };
    }
  },

  // Get chapters up to a specific chapter number (for progress tracking)
  getChaptersUpTo: async (titleId: string, maxChapterOrder: number): Promise<ApiResponse<Chapter[]>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('title_id', titleId)
        .lte('order', maxChapterOrder)
        .order('order', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get chapters up to error:', error);
      return { success: false, error: 'Failed to fetch chapters' };
    }
  },

  // Get chapter by title and order number
  getChapterByOrder: async (titleId: string, chapterOrder: number): Promise<ApiResponse<Chapter>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('title_id', titleId)
        .eq('order', chapterOrder)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get chapter by order error:', error);
      return { success: false, error: 'Failed to fetch chapter' };
    }
  },

  // Get chapter count for a title
  getChapterCount: async (titleId: string): Promise<ApiResponse<{ count: number }>> => {
    try {
      const { count, error } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('title_id', titleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { count: count || 0 } };
    } catch (error) {
      console.error('Get chapter count error:', error);
      return { success: false, error: 'Failed to get chapter count' };
    }
  },

  // Create a new chapter (admin function)
  createChapter: async (chapter: InsertChapter): Promise<ApiResponse<Chapter>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert(chapter)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Chapter created successfully' };
    } catch (error) {
      console.error('Create chapter error:', error);
      return { success: false, error: 'Failed to create chapter' };
    }
  },

  // Update a chapter (admin function)
  updateChapter: async (chapterId: string, updates: Partial<Chapter>): Promise<ApiResponse<Chapter>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', chapterId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data, message: 'Chapter updated successfully' };
    } catch (error) {
      console.error('Update chapter error:', error);
      return { success: false, error: 'Failed to update chapter' };
    }
  },

  // Search chapters by name within a title
  searchChapters: async (titleId: string, searchTerm: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('title_id', titleId)
        .ilike('name', `%${searchTerm}%`)
        .order('order', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search chapters error:', error);
      return { success: false, error: 'Failed to search chapters' };
    }
  },
};