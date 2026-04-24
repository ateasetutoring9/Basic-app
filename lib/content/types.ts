// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export type Subject = "math" | "science" | "english" | "social-studies";

export type YearLevel = 7 | 8 | 9 | 10 | 11 | 12;

export type LectureFormat = "text" | "video" | "slides";

// ─── Lecture ──────────────────────────────────────────────────────────────────

interface LectureBase {
  id: string;
  subject: Subject;
  year: YearLevel;
  topicSlug: string;
  title: string;
  description: string;
  orderIndex: number;
}

export interface TextLecture extends LectureBase {
  format: "text";
  content: string; // raw markdown
}

export interface VideoLecture extends LectureBase {
  format: "video";
  content: { youtubeId: string; durationSeconds?: number };
}

export interface SlidesLecture extends LectureBase {
  format: "slides";
  content: string; // raw HTML
}

export type Lecture = TextLecture | VideoLecture | SlidesLecture;

// ─── Questions ────────────────────────────────────────────────────────────────

export interface MultipleChoiceQuestion {
  type: "multiple-choice";
  id: string;
  text: string;
  options: string[];
  /** Zero-based index into options */
  answer: number;
  explanation?: string;
}

export interface NumericQuestion {
  type: "numeric";
  id: string;
  text: string;
  answer: number;
  /** Acceptable delta from the correct answer (default 0) */
  tolerance?: number;
  unit?: string;
  explanation?: string;
}

export interface FillBlankQuestion {
  type: "fill-blank";
  id: string;
  /** Use ___ as the blank placeholder */
  text: string;
  acceptedAnswers: string[];
  /** Default: false */
  caseSensitive?: boolean;
  explanation?: string;
}

export type Question =
  | MultipleChoiceQuestion
  | NumericQuestion
  | FillBlankQuestion;

// ─── Worksheet ────────────────────────────────────────────────────────────────

export interface Worksheet {
  id: string;
  subject: Subject;
  year: YearLevel;
  topicSlug: string;
  title: string;
  questions: Question[];
}

// ─── Topic (assembled) ────────────────────────────────────────────────────────

export interface Topic {
  subject: Subject;
  year: YearLevel;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lecture?: Lecture;
  worksheet?: Worksheet;
}
