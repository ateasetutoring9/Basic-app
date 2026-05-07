export interface InProgressTopic {
  topicSyncId: string;
  topicTitle: string;
  subjectName: string;
  yearName: string;
  worksheetSyncId: string | null;
  latestScore: number;
  latestTotal: number;
}

export interface RecommendedTopic {
  topicSyncId: string;
  topicTitle: string;
  subjectName: string;
}

export interface DashboardSubject {
  syncId: string;
  name: string;
  yearName: string;
  topicCount: number;
}

export interface RecentAttempt {
  attemptId: number;
  topicTitle: string;
  subjectName: string;
  score: number;
  total: number;
  createdAt: string;
}
