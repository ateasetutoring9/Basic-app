export type LearnLectureContent =
  | { format: "text"; markdown: string }
  | { format: "video"; youtubeId: string; durationSeconds?: number }
  | { format: "slides"; html: string };

export interface LearnLecture {
  title: string;
  isPublished: boolean;
  content: LearnLectureContent;
}

export interface LearnTopic {
  id: number;
  syncId: string;
  title: string;
  subject: {
    name: string;
    yearName: string;
    yearDisplayName: string;
  };
  lecture: LearnLecture | null;
}

export interface WorksheetMeta {
  syncId: string;
  questionCount: number;
  isPublished: boolean;
  bestAttempt: { score: number; total: number } | null;
}

export interface CommentNode {
  id: number;
  parentId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
}
