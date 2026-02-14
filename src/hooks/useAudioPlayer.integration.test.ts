import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "./useAudioPlayer";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import { invoke } from "@tauri-apps/api/core";
import type { Mock } from "vitest";
import type { Book } from "@/types/book.d";
import type { Chapter } from "@/types/chapter.d";

const mockInvoke = invoke as Mock;

const mockBook: Book = {
  id: 1,
  name: "Test Book",
  file_location: "/tmp/test.m4b",
  cover_image: "",
  author: "Test Author",
  narrator: "Test Narrator",
  duration: 3600,
  size: 100000,
  content_id: null,
  identity_method: null,
  asin: null,
  isbn: null,
};

const mockChapters: Chapter[] = [
  { id: 1, book_id: 1, chapter_index: 0, start_time: 0, end_time: 600, title: "Chapter 1" },
  { id: 2, book_id: 1, chapter_index: 1, start_time: 600, end_time: 1200, title: "Chapter 2" },
];

beforeEach(() => {
  mockInvoke.mockReset();
  useCurrentlyListeningStore.getState().clearPlayer();
  useCurrentlyListeningStore.getState().setVolume(50);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAudioPlayer", () => {
  describe("play", () => {
    it("calls invoke for progress, play, and chapters, then sets isPlaying", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "get_playback_progress":
            return null;
          case "play":
            return undefined;
          case "get_chapters":
            return [];
          default:
            return undefined;
        }
      });

      const { result } = renderHook(() => useAudioPlayer());

      // Set up the book in the store first
      act(() => {
        useCurrentlyListeningStore.getState().setBook(mockBook);
        useCurrentlyListeningStore.getState().setBookFileLocation(mockBook.file_location);
      });

      await act(async () => {
        await result.current.play(1);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_playback_progress", { bookId: 1 });
      expect(mockInvoke).toHaveBeenCalledWith("play", { bookId: 1 });
      expect(mockInvoke).toHaveBeenCalledWith("get_chapters", { bookId: 1 });
      expect(result.current.isPlaying).toBe(true);
    });

    it("seeks to saved progress position when available", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "get_playback_progress":
            return {
              id: 1,
              book_id: 1,
              position: 300,
              completed: false,
              last_listened_at: "2024-01-01",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
              chapter_index: null,
              chapter_position: null,
            };
          case "play":
            return undefined;
          case "get_chapters":
            return [];
          case "seek":
            return undefined;
          default:
            return undefined;
        }
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play(1);
      });

      // Advance past the 100ms setTimeout for seeking
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(mockInvoke).toHaveBeenCalledWith("seek", { position: 300 });
    });

    it("loads chapters and sets them in store", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "get_playback_progress":
            return null;
          case "play":
            return undefined;
          case "get_chapters":
            return mockChapters;
          default:
            return undefined;
        }
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play(1);
      });

      expect(result.current.chapters).toEqual(mockChapters);
    });
  });

  describe("pause", () => {
    it("calls pause and saves progress", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "pause":
            return undefined;
          case "save_playback_progress":
            return undefined;
          default:
            return undefined;
        }
      });

      // Set up playing state
      act(() => {
        useCurrentlyListeningStore.getState().setBook(mockBook);
        useCurrentlyListeningStore.getState().setIsPlaying(true);
        useCurrentlyListeningStore.getState().setCurrentTime(120);
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.pause();
      });

      expect(mockInvoke).toHaveBeenCalledWith("pause");
      expect(mockInvoke).toHaveBeenCalledWith("save_playback_progress", {
        bookId: 1,
        position: 120,
        chapterIndex: null,
        chapterPosition: null,
      });
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("setVolume", () => {
    it("clamps volume to 0-100 and converts to 0-1 for backend", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.setVolume(75);
      });

      expect(result.current.volume).toBe(75);
      expect(mockInvoke).toHaveBeenCalledWith("set_volume", { volume: 0.75 });
    });

    it("clamps volume above 100 to 100", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.setVolume(150);
      });

      expect(result.current.volume).toBe(100);
      expect(mockInvoke).toHaveBeenCalledWith("set_volume", { volume: 1 });
    });

    it("clamps volume below 0 to 0", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.setVolume(-10);
      });

      expect(result.current.volume).toBe(0);
      expect(mockInvoke).toHaveBeenCalledWith("set_volume", { volume: 0 });
    });
  });

  describe("loadLastListened", () => {
    it("restores book without auto-playing", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "get_last_listened":
            return [
              mockBook,
              {
                id: 1,
                book_id: 1,
                position: 500,
                completed: false,
                last_listened_at: "2024-01-01",
                created_at: "2024-01-01",
                updated_at: "2024-01-01",
                chapter_index: null,
                chapter_position: null,
              },
            ];
          case "get_chapters":
            return [];
          default:
            return undefined;
        }
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.loadLastListened();
      });

      expect(result.current.book).toEqual(mockBook);
      expect(result.current.bookFileLocation).toBe(mockBook.file_location);
      expect(result.current.duration).toBe(mockBook.duration);
      expect(result.current.currentTime).toBe(500);
      expect(result.current.isPlaying).toBe(false); // Not auto-playing
      expect(mockInvoke).not.toHaveBeenCalledWith("play", expect.anything());
    });

    it("does nothing when no last listened book", async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        switch (cmd) {
          case "get_last_listened":
            return null;
          default:
            return undefined;
        }
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.loadLastListened();
      });

      expect(result.current.book).toBeNull();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("polling", () => {
    it("polls timestamp every 500ms when playing", async () => {
      let pollCount = 0;
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === "get_current_timestamp") {
          pollCount++;
          return 100 + pollCount;
        }
        return undefined;
      });

      // Set up playing state
      act(() => {
        useCurrentlyListeningStore.getState().setBook(mockBook);
        useCurrentlyListeningStore.getState().setIsPlaying(true);
        useCurrentlyListeningStore.getState().setDuration(3600);
      });

      renderHook(() => useAudioPlayer());

      // Initial poll happens immediately
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(pollCount).toBeGreaterThanOrEqual(1);

      const countAfterFirst = pollCount;

      // Advance 500ms for next poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(pollCount).toBeGreaterThan(countAfterFirst);
    });
  });

  describe("auto-save", () => {
    it("saves progress every 15 seconds while playing", async () => {
      mockInvoke.mockResolvedValue(undefined);

      act(() => {
        useCurrentlyListeningStore.getState().setBook(mockBook);
        useCurrentlyListeningStore.getState().setIsPlaying(true);
        useCurrentlyListeningStore.getState().setCurrentTime(100);
      });

      renderHook(() => useAudioPlayer());

      // Advance 15 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000);
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        "save_playback_progress",
        expect.objectContaining({ bookId: 1 })
      );
    });
  });
});
