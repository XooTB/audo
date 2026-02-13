export interface PlaybackProgress {
  id: number;
  book_id: number;
  position: number;
  completed: boolean;
  last_listened_at: string;
  created_at: string;
  updated_at: string;
  chapter_index: number | null;
  chapter_position: number | null;
}
