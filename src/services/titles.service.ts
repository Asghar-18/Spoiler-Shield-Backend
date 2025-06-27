import { supabase } from '../lib/supabase';
import type { Title, InsertTitle, ApiResponse } from '../types/database.type';
import { getSignedCoverUrl } from '../utils/signed-url';

export const titlesService = {
  // Get all titles (books)
  getTitles: async (): Promise<ApiResponse<Title[]>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const titlesWithSignedUrls = await Promise.all(
        (data || []).map(async (title) => ({
          ...title,
          coverImage: title.coverImage
            ? await getSignedCoverUrl(title.coverImage)
            : null,
        }))
      );

      return { success: true, data: titlesWithSignedUrls };
    } catch (error) {
      console.error('Get titles error:', error);
      return { success: false, error: 'Failed to fetch titles' };
    }
  },

  // Get a single title by ID
  getTitleById: async (titleId: string): Promise<ApiResponse<Title>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .eq('id', titleId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const titleWithSignedUrl = {
        ...data,
        coverImage: data.coverImage
          ? await getSignedCoverUrl(data.coverImage)
          : null,
      };

      return { success: true, data: titleWithSignedUrl };
    } catch (error) {
      console.error('Get title by ID error:', error);
      return { success: false, error: 'Failed to fetch title' };
    }
  },

  // Get title with chapter count
  getTitleWithChapterCount: async (titleId: string): Promise<ApiResponse<Title & { chapter_count: number }>> => {
    try {
      const { data: titleData, error: titleError } = await supabase
        .from('titles')
        .select('*')
        .eq('id', titleId)
        .single();

      if (titleError) {
        return { success: false, error: titleError.message };
      }

      const { count, error: countError } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('title_id', titleId);

      if (countError) {
        return { success: false, error: countError.message };
      }

      const titleWithSignedUrl = {
        ...titleData,
        coverImage: titleData.coverImage
          ? await getSignedCoverUrl(titleData.coverImage)
          : null,
        chapter_count: count || 0
      };

      return { 
        success: true, 
        data: titleWithSignedUrl
      };
    } catch (error) {
      console.error('Get title with chapter count error:', error);
      return { success: false, error: 'Failed to fetch title with chapter count' };
    }
  },

  // Get titles with their chapter counts
  getTitlesWithChapterCounts: async (): Promise<ApiResponse<(Title & { chapter_count: number })[]>> => {
    try {
      const { data: titles, error: titlesError } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false });

      if (titlesError) {
        return { success: false, error: titlesError.message };
      }

      // Get chapter counts for all titles and add signed URLs
      const titlesWithCounts = await Promise.all(
        (titles || []).map(async (title) => {
          const { count } = await supabase
            .from('chapters')
            .select('*', { count: 'exact', head: true })
            .eq('title_id', title.id);

          return {
            ...title,
            coverImage: title.coverImage
              ? await getSignedCoverUrl(title.coverImage)
              : null,
            chapter_count: count || 0
          };
        })
      );

      return { success: true, data: titlesWithCounts };
    } catch (error) {
      console.error('Get titles with chapter counts error:', error);
      return { success: false, error: 'Failed to fetch titles with chapter counts' };
    }
  },

  // Create a new title (admin function)
  createTitle: async (title: InsertTitle): Promise<ApiResponse<Title>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .insert(title)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Title created successfully' 
      };
    } catch (error) {
      console.error('Create title error:', error);
      return { success: false, error: 'Failed to create title' };
    }
  },

  // Update a title (admin function)
  updateTitle: async (titleId: string, updates: Partial<Title>): Promise<ApiResponse<Title>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .update(updates)
        .eq('id', titleId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data, 
        message: 'Title updated successfully' 
      };
    } catch (error) {
      console.error('Update title error:', error);
      return { success: false, error: 'Failed to update title' };
    }
  },

  // Delete a title (admin function)
  deleteTitle: async (titleId: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('id', titleId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Title deleted successfully' 
      };
    } catch (error) {
      console.error('Delete title error:', error);
      return { success: false, error: 'Failed to delete title' };
    }
  },

  // Search titles by name
  searchTitles: async (searchTerm: string): Promise<ApiResponse<Title[]>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const titlesWithSignedUrls = await Promise.all(
        (data || []).map(async (title) => ({
          ...title,
          coverImage: title.coverImage
            ? await getSignedCoverUrl(title.coverImage)
            : null,
        }))
      );

      return { success: true, data: titlesWithSignedUrls };
    } catch (error) {
      console.error('Search titles error:', error);
      return { success: false, error: 'Failed to search titles' };
    }
  },

  // Search titles by author
  searchTitlesByAuthor: async (authorName: string): Promise<ApiResponse<Title[]>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .ilike('author', `%${authorName}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const titlesWithSignedUrls = await Promise.all(
        (data || []).map(async (title) => ({
          ...title,
          coverImage: title.coverImage
            ? await getSignedCoverUrl(title.coverImage)
            : null,
        }))
      );

      return { success: true, data: titlesWithSignedUrls };
    } catch (error) {
      console.error('Search titles by author error:', error);
      return { success: false, error: 'Failed to search titles by author' };
    }
  },

  // Get popular titles (could be based on user progress or other metrics)
  getPopularTitles: async (limit: number = 10): Promise<ApiResponse<(Title & { reader_count: number })[]>> => {
    try {
      // Get titles with the most user progress entries (indicating popularity)
      const { data, error } = await supabase
        .from('titles')
        .select(`
          *,
          user_progress(count)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform the data to include reader count and signed URLs
      const popularTitlesWithUrls = await Promise.all(
        (data || []).map(async (title) => ({
          ...title,
          coverImage: title.coverImage
            ? await getSignedCoverUrl(title.coverImage)
            : null,
          reader_count: Array.isArray(title.user_progress) ? title.user_progress.length : 0,
          user_progress: undefined // Remove the user_progress array from response
        }))
      );

      const sortedTitles = popularTitlesWithUrls.sort((a, b) => b.reader_count - a.reader_count);

      return { success: true, data: sortedTitles };
    } catch (error) {
      console.error('Get popular titles error:', error);
      return { success: false, error: 'Failed to fetch popular titles' };
    }
  },

  // Get recent titles
  getRecentTitles: async (limit: number = 10): Promise<ApiResponse<Title[]>> => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      const titlesWithSignedUrls = await Promise.all(
        (data || []).map(async (title) => ({
          ...title,
          coverImage: title.coverImage
            ? await getSignedCoverUrl(title.coverImage)
            : null,
        }))
      );

      return { success: true, data: titlesWithSignedUrls };
    } catch (error) {
      console.error('Get recent titles error:', error);
      return { success: false, error: 'Failed to fetch recent titles' };
    }
  },
};