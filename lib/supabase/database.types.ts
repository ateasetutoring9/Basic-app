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
      users: {
        Row: {
          id: number;
          sync_id: string;
          email: string;
          password_hash: string;
          email_verified_at: string | null;
          email_verification_token: string | null;
          email_verification_expires_at: string | null;
          email_verification_sent_at: string | null;
          password_reset_token: string | null;
          password_reset_expires_at: string | null;
          password_changed_at: string | null;
          failed_login_attempts: number;
          locked_until: string | null;
          display_name: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          email: string;
          password_hash: string;
          email_verified_at?: string | null;
          email_verification_token?: string | null;
          email_verification_expires_at?: string | null;
          email_verification_sent_at?: string | null;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
          password_changed_at?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          email?: string;
          password_hash?: string;
          email_verified_at?: string | null;
          email_verification_token?: string | null;
          email_verification_expires_at?: string | null;
          email_verification_sent_at?: string | null;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
          password_changed_at?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      years: {
        Row: {
          id: number;
          sync_id: string;
          name: string;
          display_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          name: string;
          display_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          name?: string;
          display_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: number;
          sync_id: string;
          year_id: number;
          name: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          year_id: number;
          name: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          year_id?: number;
          name?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_year_id_fkey";
            columns: ["year_id"];
            referencedRelation: "years";
            referencedColumns: ["id"];
          }
        ];
      };
      topics: {
        Row: {
          id: number;
          sync_id: string;
          subject_id: number;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          is_published: boolean;
          published_at: string | null;
          created_by_id: number | null;
          updated_by_id: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          subject_id: number;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          subject_id?: number;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      lectures: {
        Row: {
          id: number;
          sync_id: string;
          topic_id: number;
          title: string;
          format: "text" | "video" | "slides";
          content: Json;
          is_published: boolean;
          published_at: string | null;
          created_by_id: number | null;
          updated_by_id: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          topic_id: number;
          title: string;
          format: "text" | "video" | "slides";
          content: Json;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          topic_id?: number;
          title?: string;
          format?: "text" | "video" | "slides";
          content?: Json;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
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
          id: number;
          sync_id: string;
          topic_id: number;
          title: string;
          questions: Json;
          difficulty: number;
          is_published: boolean;
          published_at: string | null;
          created_by_id: number | null;
          updated_by_id: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          topic_id: number;
          title: string;
          questions: Json;
          difficulty: number;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          topic_id?: number;
          title?: string;
          questions?: Json;
          difficulty?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_by_id?: number | null;
          updated_by_id?: number | null;
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
          id: number;
          sync_id: string;
          user_id: number;
          worksheet_id: number;
          score: number;
          total: number;
          answers: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          user_id: number;
          worksheet_id: number;
          score: number;
          total: number;
          answers?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          user_id?: number;
          worksheet_id?: number;
          score?: number;
          total?: number;
          answers?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
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
          id: number;
          sync_id: string;
          topic_id: number;
          user_id: number;
          parent_comment_id: number | null;
          body: string;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          topic_id: number;
          user_id: number;
          parent_comment_id?: number | null;
          body: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          topic_id?: number;
          user_id?: number;
          parent_comment_id?: number | null;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            referencedRelation: "comments";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: number;
          sync_id: string;
          reporter_id: number;
          entity_type: "topic" | "lecture" | "worksheet" | "comment";
          entity_id: number;
          reason: "incorrect" | "inappropriate" | "spam" | "other";
          details: string | null;
          status: "open" | "resolved" | "dismissed";
          resolved_by: number | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          reporter_id: number;
          entity_type: "topic" | "lecture" | "worksheet" | "comment";
          entity_id: number;
          reason: "incorrect" | "inappropriate" | "spam" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: number | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          reporter_id?: number;
          entity_type?: "topic" | "lecture" | "worksheet" | "comment";
          entity_id?: number;
          reason?: "incorrect" | "inappropriate" | "spam" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          resolved_by?: number | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      login_attempts: {
        Row: {
          id: number;
          sync_id: string;
          user_id: number | null;
          email_attempted: string;
          outcome: "success" | "wrong_password" | "user_not_found" | "account_locked" | "email_not_verified" | "rate_limited" | "error";
          failure_detail: string | null;
          ip_address: string;
          user_agent: string | null;
          attempted_at: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          user_id?: number | null;
          email_attempted: string;
          outcome: "success" | "wrong_password" | "user_not_found" | "account_locked" | "email_not_verified" | "rate_limited" | "error";
          failure_detail?: string | null;
          ip_address: string;
          user_agent?: string | null;
          attempted_at?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "login_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      roles: {
        Row: {
          id: number;
          sync_id: string;
          name: string;
          display_name: string;
          description: string | null;
          is_system_role: boolean;
          is_default_for_signup: boolean;
          created_at: string;
          created_by_id: number | null;
          updated_at: string;
          updated_by_id: number | null;
          deleted_at: string | null;
          deleted_by_id: number | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          is_system_role?: boolean;
          is_default_for_signup?: boolean;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          is_system_role?: boolean;
          is_default_for_signup?: boolean;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "roles_created_by_id_fkey";
            columns: ["created_by_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roles_updated_by_id_fkey";
            columns: ["updated_by_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roles_deleted_by_id_fkey";
            columns: ["deleted_by_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          id: number;
          sync_id: string;
          user_id: number;
          role_id: number;
          created_at: string;
          created_by_id: number | null;
          updated_at: string;
          updated_by_id: number | null;
          deleted_at: string | null;
          deleted_by_id: number | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          user_id: number;
          role_id: number;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          user_id?: number;
          role_id?: number;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          }
        ];
      };
      permissions: {
        Row: {
          id: number;
          sync_id: string;
          resource: string;
          action: "read" | "create" | "update" | "delete" | "approve" | "moderate" | "assign";
          description: string | null;
          created_at: string;
          created_by_id: number | null;
          updated_at: string;
          updated_by_id: number | null;
          deleted_at: string | null;
          deleted_by_id: number | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          resource: string;
          action: "read" | "create" | "update" | "delete" | "approve" | "moderate" | "assign";
          description?: string | null;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          resource?: string;
          action?: "read" | "create" | "update" | "delete" | "approve" | "moderate" | "assign";
          description?: string | null;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: number;
          sync_id: string;
          role_id: number;
          permission_id: number;
          created_at: string;
          created_by_id: number | null;
          updated_at: string;
          updated_by_id: number | null;
          deleted_at: string | null;
          deleted_by_id: number | null;
        };
        Insert: {
          id?: number;
          sync_id?: string;
          role_id: number;
          permission_id: number;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Update: {
          id?: number;
          sync_id?: string;
          role_id?: number;
          permission_id?: number;
          created_at?: string;
          created_by_id?: number | null;
          updated_at?: string;
          updated_by_id?: number | null;
          deleted_at?: string | null;
          deleted_by_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
