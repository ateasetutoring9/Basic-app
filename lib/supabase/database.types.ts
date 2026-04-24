export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_editor: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_editor?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          is_editor?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          slug: string;
          name: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          subject_slug: string;
          year_level: number;
          slug: string;
          title: string;
          description: string | null;
          order_index: number;
          is_published: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          subject_slug: string;
          year_level: number;
          slug: string;
          title: string;
          description?: string | null;
          order_index?: number;
          is_published?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          subject_slug?: string;
          year_level?: number;
          slug?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          is_published?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "topics_subject_slug_fkey";
            columns: ["subject_slug"];
            referencedRelation: "subjects";
            referencedColumns: ["slug"];
          }
        ];
      };
      lectures: {
        Row: {
          id: string;
          topic_id: string;
          format: "text" | "video" | "slides";
          content: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          topic_id: string;
          format: "text" | "video" | "slides";
          content: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          topic_id?: string;
          format?: "text" | "video" | "slides";
          content?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lectures_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      worksheets: {
        Row: {
          id: string;
          topic_id: string;
          title: string;
          questions: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          topic_id: string;
          title: string;
          questions: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          topic_id?: string;
          title?: string;
          questions?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "worksheets_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          worksheet_id: string;
          score: number;
          total: number;
          answers: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          worksheet_id: string;
          score: number;
          total: number;
          answers?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          worksheet_id?: string;
          score?: number;
          total?: number;
          answers?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_worksheet_id_fkey";
            columns: ["worksheet_id"];
            referencedRelation: "worksheets";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          topic_id: string;
          user_id: string;
          parent_comment_id: string | null;
          body: string;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          topic_id: string;
          user_id: string;
          parent_comment_id?: string | null;
          body: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          topic_id?: string;
          user_id?: string;
          parent_comment_id?: string | null;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          entity_type: "topic" | "lecture" | "worksheet" | "comment";
          entity_id: string;
          reason: "incorrect" | "inappropriate" | "spam" | "other";
          details: string | null;
          status: "open" | "resolved" | "dismissed";
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          entity_type: "topic" | "lecture" | "worksheet" | "comment";
          entity_id: string;
          reason: "incorrect" | "inappropriate" | "spam" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          entity_type?: "topic" | "lecture" | "worksheet" | "comment";
          entity_id?: string;
          reason?: "incorrect" | "inappropriate" | "spam" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      content_versions: {
        Row: {
          id: string;
          entity_type: "topic" | "lecture" | "worksheet";
          entity_id: string;
          operation: "insert" | "update" | "delete";
          snapshot: Json;
          changed_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          entity_type: "topic" | "lecture" | "worksheet";
          entity_id: string;
          operation: "insert" | "update" | "delete";
          snapshot: Json;
          changed_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          entity_type?: "topic" | "lecture" | "worksheet";
          entity_id?: string;
          operation?: "insert" | "update" | "delete";
          snapshot?: Json;
          changed_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_editor: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
