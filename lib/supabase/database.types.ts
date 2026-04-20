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
      attempts: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          year: number;
          topic_slug: string;
          worksheet_id: string;
          score: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          year: number;
          topic_slug: string;
          worksheet_id: string;
          score: number;
          total: number;
          created_at?: string;
        };
        // Attempts are immutable — no update policy exists
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          year?: number;
          topic_slug?: string;
          worksheet_id?: string;
          score?: number;
          total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
