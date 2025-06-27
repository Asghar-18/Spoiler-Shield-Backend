// Database type definitions based on your schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
        };
      };
      titles: {
        Row: {
          id: string;
          name: string | null;
          coverImage: string | null;
          author: string | null;
          description?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          coverImage?: string | null;
          author: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          coverImage?: string | null;
          author: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          user_id: string;
          title_id: string;
          chapter_limit: number | null;
          question_text: string | null;
          answer_text: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_id: string;
          chapter_limit?: number | null;
          question_text?: string | null;
          answer_text?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title_id?: string;
          chapter_limit?: number | null;
          question_text?: string | null;
          answer_text?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          title_id: string;
          order: number | null;
          name: string | null;
          content: string | null;
        };
        Insert: {
          id?: string;
          title_id: string;
          order?: number | null;
          name?: string | null;
          content?: string | null;
        };
        Update: {
          id?: string;
          title_id?: string;
          order?: number | null;
          name?: string | null;
          content?: string | null;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          title_id: string;
          current_chapter?: number;
          total_chapters?: number;
          progress_percentage?: number;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_id: string;
          current_chapter?: number;
          total_chapters?: number;
          progress_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title_id?: string;
          current_chapter?: number;
          total_chapters?: number;
          progress_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapter_embeddings: {
        Row: {
          id: string;
          chapter_id: string;
          embedding: number[];
        };
        Insert: {
          id?: string;
          chapter_id: string;
          embedding: number[];
        };
        Update: {
          id?: string;
          chapter_id?: string;
          embedding?: number[];
        };
      };
    };
  };
};

// Helper types for easier usage
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Title = Database["public"]["Tables"]["titles"]["Row"];
export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type UserProgress = Database["public"]["Tables"]["user_progress"]["Row"];
export type ChapterEmbedding = Database["public"]["Tables"]["chapter_embeddings"]["Row"];

export type InsertUser = Database["public"]["Tables"]["users"]["Insert"];
export type InsertTitle = Database["public"]["Tables"]["titles"]["Insert"];
export type InsertChapter = Database["public"]["Tables"]["chapters"]["Insert"];
export type InsertQuestion = Database["public"]["Tables"]["questions"]["Insert"];
export type InsertUserProgress = Database["public"]["Tables"]["user_progress"]["Insert"];
export type InsertChapterEmbedding = Database["public"]["Tables"]["chapter_embeddings"]["Insert"];

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Extended types with relations
export interface QuestionWithTitle extends Question {
  titles?: Title;
}

export interface UserProgressWithTitle extends UserProgress {
  titles?: Title;
}

export interface ChapterWithEmbedding extends Chapter {
  chapter_embeddings?: ChapterEmbedding;
}

export interface ChapterEmbeddingWithChapter extends ChapterEmbedding {
  chapters?: Chapter;
}