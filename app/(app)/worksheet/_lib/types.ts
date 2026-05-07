import type { Question } from "@/lib/content/types";

export interface WorksheetData {
  id: number; // internal — used only for the /api/attempts POST, never in URLs
  syncId: string;
  title: string;
  questions: Question[];
  difficulty: number;
  topic: {
    id: number; // internal — used for next-topic query server-side only
    syncId: string;
    title: string;
    subject: {
      id: number; // internal — used for next-topic query server-side only
      name: string;
      yearName: string;
      yearDisplayName: string;
    };
  };
}

export interface NextTopic {
  syncId: string;
  title: string;
}
