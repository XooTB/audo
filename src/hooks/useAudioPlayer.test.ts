import { findCurrentChapter } from "./useAudioPlayer";
import type { Chapter } from "@/types/chapter.d";

const chapters: Chapter[] = [
  { id: 1, book_id: 1, chapter_index: 0, start_time: 0, end_time: 600, title: "Chapter 1" },
  { id: 2, book_id: 1, chapter_index: 1, start_time: 600, end_time: 1200, title: "Chapter 2" },
  { id: 3, book_id: 1, chapter_index: 2, start_time: 1200, end_time: 1800, title: "Chapter 3" },
];

describe("findCurrentChapter", () => {
  it("returns null for empty chapters array", () => {
    expect(findCurrentChapter([], 100)).toBeNull();
  });

  it("finds correct chapter by time position", () => {
    const result = findCurrentChapter(chapters, 300);
    expect(result).toEqual(chapters[0]);
  });

  it("finds second chapter for time in its range", () => {
    const result = findCurrentChapter(chapters, 900);
    expect(result).toEqual(chapters[1]);
  });

  it("handles exact boundary — 600s is start of chapter 2, not end of chapter 1", () => {
    // The function uses >= start_time && < end_time
    // So 600 belongs to chapter 2 (start_time=600), not chapter 1 (end_time=600)
    const result = findCurrentChapter(chapters, 600);
    expect(result).toEqual(chapters[1]);
  });

  it("returns last chapter when time exceeds all chapter end times", () => {
    const result = findCurrentChapter(chapters, 5000);
    expect(result).toEqual(chapters[2]);
  });

  it("returns null when time is before all chapters", () => {
    const gappedChapters: Chapter[] = [
      { id: 1, book_id: 1, chapter_index: 0, start_time: 100, end_time: 600, title: "Chapter 1" },
    ];
    const result = findCurrentChapter(gappedChapters, 50);
    expect(result).toBeNull();
  });

  it("finds chapter at time 0 when first chapter starts at 0", () => {
    const result = findCurrentChapter(chapters, 0);
    expect(result).toEqual(chapters[0]);
  });

  it("finds last chapter at its start boundary", () => {
    const result = findCurrentChapter(chapters, 1200);
    expect(result).toEqual(chapters[2]);
  });
});
