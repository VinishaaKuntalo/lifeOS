export type JournalMood = "great" | "good" | "neutral" | "low" | "bad";

export type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content_json: Record<string, unknown>;
  content_text: string;
  mood: JournalMood | null;
  word_count: number;
  created_at: string;
  updated_at: string;
};

export type JournalSummary = {
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
};

export type JournalWorkspaceData = {
  today: string;
  summary: JournalSummary;
  entries: JournalEntry[];
};

export type JournalMutationResponse = {
  data: JournalWorkspaceData;
  message: string;
};
