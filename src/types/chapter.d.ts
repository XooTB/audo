export interface Chapter {
  id: number;
  book_id: number;
  chapter_index: number;
  start_time: number;
  end_time: number;
  title: string | null;
}
