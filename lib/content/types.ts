// ─── Year ─────────────────────────────────────────────────────────────────────

export interface Year {
  id: number;
  syncId: string;
  name: string;        // e.g. "year-7"
  displayName: string; // e.g. "Year 7"
  isActive: boolean;
}

// ─── Subject ──────────────────────────────────────────────────────────────────

export interface Subject {
  id: number;
  syncId: string;
  name: string;        // e.g. "Mathematics"
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  year: Year;
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export type LectureFormat = "text" | "video" | "slides";

export interface TextLecture {
  format: "text";
  title: string;
  content: string; // raw markdown
}

export interface VideoLecture {
  format: "video";
  title: string;
  content: { youtubeId: string; durationSeconds?: number };
}

export interface SlidesLecture {
  format: "slides";
  title: string;
  content: string; // raw HTML
}

export type Lecture = TextLecture | VideoLecture | SlidesLecture;

// ─── Questions ────────────────────────────────────────────────────────────────

export interface McqSingleQuestion {
  type: "mcq_single";
  id: string;
  text: string;
  options: string[];
  answer: number; // zero-based index
  explanation?: string;
}

export interface McqMultiQuestion {
  type: "mcq_multi";
  id: string;
  text: string;
  options: string[];
  answers: number[]; // zero-based indices, all must be selected
  explanation?: string;
}

export interface ShortTextQuestion {
  type: "short_text";
  id: string;
  text: string;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  explanation?: string;
}

export interface NumericQuestion {
  type: "numeric";
  id: string;
  text: string;
  answer: number;
  tolerance?: number;
  unit?: string;
  explanation?: string;
}

export interface EssayQuestion {
  type: "essay";
  id: string;
  text: string;
  hint?: string; // shown after submission
}

export type Question =
  | McqSingleQuestion
  | McqMultiQuestion
  | ShortTextQuestion
  | NumericQuestion
  | EssayQuestion;

// ─── Worksheet ────────────────────────────────────────────────────────────────

export interface Worksheet {
  id: number;
  syncId: string;
  title: string;
  questions: Question[];
  difficulty: number; // 1–5
}

// ─── Topic (assembled) ────────────────────────────────────────────────────────

// Topics are identified externally by syncId (uuid).
// subject and year are always included via join — never null on a loaded topic.
export interface Topic {
  id: number;
  syncId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  subject: Subject;
  lecture?: Lecture;
  worksheet?: Worksheet;
}
