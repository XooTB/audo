import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import type { Book } from "@/types/book.d";
import type { Chapter } from "@/types/chapter.d";
import type { PlaybackProgress } from "@/types/playbackProgress.d";

/**
 * Find the chapter that contains the given time position.
 * Returns null if no chapters or time is before all chapters.
 */
function findCurrentChapter(chapters: Chapter[], currentTime: number): Chapter | null {
  if (chapters.length === 0) return null;

  for (const chapter of chapters) {
    if (currentTime >= chapter.start_time && currentTime < chapter.end_time) {
      return chapter;
    }
  }

  // If past last chapter's end, return last chapter
  const lastChapter = chapters[chapters.length - 1];
  if (currentTime >= lastChapter.end_time) {
    return lastChapter;
  }

  return null;
}

/**
 * Audio Player Hook
 *
 * This is the ONLY place where Tauri backend audio commands are invoked.
 * Components should never directly call invoke() for audio operations.
 *
 * Architecture:
 * - Stateless facade over Zustand store
 * - All state lives in the global store
 * - Methods are stable (useCallback with minimal deps)
 * - Progress polling managed internally
 * - Playback progress is persisted to DB automatically
 */
export function useAudioPlayer() {
  // Read state from Zustand store
  const book = useCurrentlyListeningStore((state) => state.book);
  const bookFileLocation = useCurrentlyListeningStore((state) => state.bookFileLocation);
  const isPlaying = useCurrentlyListeningStore((state) => state.isPlaying);
  const currentTime = useCurrentlyListeningStore((state) => state.currentTime);
  const duration = useCurrentlyListeningStore((state) => state.duration);
  const progress = useCurrentlyListeningStore((state) => state.progress);
  const volume = useCurrentlyListeningStore((state) => state.volume);
  const error = useCurrentlyListeningStore((state) => state.error);
  const chapters = useCurrentlyListeningStore((state) => state.chapters);
  const currentChapter = useCurrentlyListeningStore((state) => state.currentChapter);

  // Get store setters
  const setBook = useCurrentlyListeningStore((state) => state.setBook);
  const setBookFileLocation = useCurrentlyListeningStore((state) => state.setBookFileLocation);
  const setIsPlaying = useCurrentlyListeningStore((state) => state.setIsPlaying);
  const setCurrentTime = useCurrentlyListeningStore((state) => state.setCurrentTime);
  const setDuration = useCurrentlyListeningStore((state) => state.setDuration);
  const setProgress = useCurrentlyListeningStore((state) => state.setProgress);
  const setVolume = useCurrentlyListeningStore((state) => state.setVolume);
  const setError = useCurrentlyListeningStore((state) => state.setError);
  const setChapters = useCurrentlyListeningStore((state) => state.setChapters);
  const setCurrentChapter = useCurrentlyListeningStore((state) => state.setCurrentChapter);

  // Refs for values needed in callbacks without causing re-renders
  const bookRef = useRef(book);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const chaptersRef = useRef(chapters);
  bookRef.current = book;
  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;
  chaptersRef.current = chapters;

  /**
   * Save current playback progress to the database
   */
  const saveProgress = useCallback(
    async (bookId: number, position: number) => {
      try {
        const chapter = useCurrentlyListeningStore.getState().currentChapter;
        const chapterIndex = chapter ? chapter.chapter_index : null;
        const chapterPosition = chapter ? position - chapter.start_time : null;

        await invoke("save_playback_progress", {
          bookId, position, chapterIndex, chapterPosition,
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    []
  );

  /**
   * Seek to specific position in seconds.
   * When paused, also saves progress to DB so resuming doesn't revert the seek.
   */
  const seek = useCallback(
    async (seconds: number) => {
      try {
        await invoke("seek", { position: seconds });
      } catch (err) {
        console.error("Seek error:", err);
      }

      setCurrentTime(seconds);

      // Persist when paused so play() doesn't revert to the old DB position
      if (!isPlayingRef.current) {
        const currentBook = bookRef.current;
        if (currentBook) {
          await saveProgress(currentBook.id, seconds);
        }
      }
    },
    [setCurrentTime, saveProgress]
  );

  /**
   * Skip forward by N seconds
   */
  const skipForward = useCallback(
    async (seconds: number = 30) => {
      const newTime = currentTimeRef.current + seconds;
      await seek(newTime);
    },
    [seek]
  );

  /**
   * Skip backward by N seconds
   */
  const skipBackward = useCallback(
    async (seconds: number = 10) => {
      const newTime = Math.max(0, currentTimeRef.current - seconds);
      await seek(newTime);
    },
    [seek]
  );

  /**
   * Seek to the start of a specific chapter by index.
   * If not currently playing, starts playback first then seeks.
   */
  const seekToChapter = useCallback(
    async (chapterIndex: number) => {
      const chaptersList = chaptersRef.current;
      const chapter = chaptersList.find((c) => c.chapter_index === chapterIndex);
      if (!chapter) return;

      const currentBook = bookRef.current;
      if (!currentBook) return;

      // Save current progress before switching
      await saveProgress(currentBook.id, currentTimeRef.current);

      setCurrentChapter(chapter);

      if (!isPlayingRef.current) {
        // Not currently playing — start playback then seek to chapter
        await invoke("play", { bookId: currentBook.id });
        setIsPlaying(true);
        // Small delay to let the sink initialize before seeking
        setTimeout(async () => {
          try {
            await invoke("seek", { position: chapter.start_time });
            setCurrentTime(chapter.start_time);
          } catch (err) {
            console.error("Failed to seek to chapter:", err);
          }
        }, 100);
      } else {
        // Already playing — just seek
        await seek(chapter.start_time);
      }
    },
    [seek, saveProgress, setCurrentChapter, setIsPlaying, setCurrentTime]
  );

  /**
   * Play a book by ID
   * Fetches saved progress and seeks to the saved position after playback starts
   */
  const play = useCallback(
    async (bookId: number) => {
      try {
        setError(null);

        // If switching books, save the current book's progress first
        const currentBook = bookRef.current;
        if (currentBook && currentBook.id !== bookId && isPlayingRef.current) {
          await saveProgress(currentBook.id, currentTimeRef.current);
        }

        // Fetch saved progress for the target book
        const savedProgress = await invoke<PlaybackProgress | null>("get_playback_progress", { bookId });

        await invoke("play", { bookId });
        setIsPlaying(true);

        // Fetch chapters for the book
        const bookChapters = await invoke<Chapter[]>("get_chapters", { bookId });
        setChapters(bookChapters);

        // If there's saved progress and we loaded a new source, seek to it
        if (savedProgress && savedProgress.position > 0) {
          let resumePosition = savedProgress.position;
          let resumeChapter: Chapter | null = null;

          // Try chapter-based resume first
          if (
            savedProgress.chapter_index !== null &&
            savedProgress.chapter_position !== null &&
            bookChapters.length > 0
          ) {
            const chapter = bookChapters.find(
              (c) => c.chapter_index === savedProgress.chapter_index
            );
            if (chapter) {
              const chapterDuration = chapter.end_time - chapter.start_time;
              if (
                savedProgress.chapter_position >= 0 &&
                savedProgress.chapter_position <= chapterDuration
              ) {
                const reconstructedPosition =
                  chapter.start_time + savedProgress.chapter_position;
                if (Math.abs(reconstructedPosition - savedProgress.position) <= 2) {
                  resumePosition = reconstructedPosition;
                  resumeChapter = chapter;
                }
              }
            }
          }

          // Fall back to position-based chapter detection
          if (!resumeChapter && bookChapters.length > 0) {
            resumeChapter = findCurrentChapter(bookChapters, resumePosition);
          }

          setCurrentChapter(resumeChapter);

          // Small delay to let the sink initialize before seeking
          setTimeout(async () => {
            try {
              await invoke("seek", { position: resumePosition });
              setCurrentTime(resumePosition);
            } catch (err) {
              console.error("Failed to seek to saved position:", err);
            }
          }, 100);
        } else {
          // No saved progress — detect chapter at start
          if (bookChapters.length > 0) {
            setCurrentChapter(findCurrentChapter(bookChapters, 0));
          } else {
            setCurrentChapter(null);
          }
        }
      } catch (error) {
        console.error("Play error:", error);
        setError(error instanceof Error ? error.message : String(error));
        setIsPlaying(false);
      }
    },
    [setIsPlaying, setError, setCurrentTime, setChapters, setCurrentChapter, saveProgress]
  );

  /**
   * Pause playback and save progress
   */
  const pause = useCallback(async () => {
    try {
      setError(null);
      await invoke("pause");
      setIsPlaying(false);

      // Save progress on pause
      const currentBook = bookRef.current;
      if (currentBook) {
        await saveProgress(currentBook.id, currentTimeRef.current);
      }
    } catch (error) {
      console.error("Pause error:", error);
      setError(error instanceof Error ? error.message : String(error));
    }
  }, [setIsPlaying, setError, saveProgress]);

  /**
   * Toggle play/pause for current book
   */
  const togglePlayPause = useCallback(async () => {
    if (!book) return;

    if (isPlaying) {
      await pause();
    } else {
      await play(book.id);
    }
  }, [book, isPlaying, play, pause]);

  /**
   * Set volume (0-100)
   * Converts to 0.0-1.0 for the backend
   */
  const handleSetVolume = useCallback(
    async (newVolume: number) => {
      const clamped = Math.max(0, Math.min(100, newVolume));
      setVolume(clamped);
      try {
        await invoke("set_volume", { volume: clamped / 100 });
      } catch (err) {
        console.error("Set volume error:", err);
      }
    },
    [setVolume]
  );

  /**
   * Load the last listened book into the store (no auto-play)
   */
  const loadLastListened = useCallback(async () => {
    try {
      const result = await invoke<[Book, PlaybackProgress] | null>("get_last_listened");
      if (result) {
        const [lastBook, lastProgress] = result;
        setBook(lastBook);
        setBookFileLocation(lastBook.file_location);
        setDuration(lastBook.duration);

        // Fetch chapters for the last listened book
        const bookChapters = await invoke<Chapter[]>("get_chapters", { bookId: lastBook.id });
        setChapters(bookChapters);

        let resumePosition = lastProgress.position;
        let resumeChapter: Chapter | null = null;

        // Try chapter-based resume first
        if (
          lastProgress.chapter_index !== null &&
          lastProgress.chapter_position !== null &&
          bookChapters.length > 0
        ) {
          const chapter = bookChapters.find(
            (c) => c.chapter_index === lastProgress.chapter_index
          );
          if (chapter) {
            const chapterDuration = chapter.end_time - chapter.start_time;
            if (
              lastProgress.chapter_position >= 0 &&
              lastProgress.chapter_position <= chapterDuration
            ) {
              const reconstructedPosition =
                chapter.start_time + lastProgress.chapter_position;
              if (Math.abs(reconstructedPosition - lastProgress.position) <= 2) {
                resumePosition = reconstructedPosition;
                resumeChapter = chapter;
              }
            }
          }
        }

        // Fall back to position-based chapter detection
        if (!resumeChapter && bookChapters.length > 0) {
          resumeChapter = findCurrentChapter(bookChapters, resumePosition);
        }

        setCurrentChapter(resumeChapter);
        setCurrentTime(resumePosition);
        if (lastBook.duration > 0) {
          setProgress((resumePosition / lastBook.duration) * 100);
        }
      }
    } catch (err) {
      console.error("Failed to load last listened book:", err);
    }
  }, [setBook, setBookFileLocation, setDuration, setCurrentTime, setProgress, setChapters, setCurrentChapter]);

  /**
   * Progress polling effect
   * Polls backend for current timestamp when playing
   * Updates store with current position every 500ms
   */
  useEffect(() => {
    if (!isPlaying) return;

    const pollTimestamp = async () => {
      try {
        const timestamp = await invoke<number>("get_current_timestamp");
        setCurrentTime(timestamp);

        // Calculate progress percentage if duration is available
        if (duration > 0) {
          const progressPercent = (timestamp / duration) * 100;
          setProgress(progressPercent);
        }

        // Detect chapter changes
        const chapter = findCurrentChapter(chaptersRef.current, timestamp);
        const prevChapter = useCurrentlyListeningStore.getState().currentChapter;
        if (chapter?.id !== prevChapter?.id) {
          setCurrentChapter(chapter);
        }
      } catch (error) {
        console.error("Timestamp poll error:", error);
      }
    };

    // Poll immediately, then every 500ms
    pollTimestamp();
    const interval = setInterval(pollTimestamp, 500);

    return () => clearInterval(interval);
  }, [isPlaying, duration, setCurrentTime, setProgress, setCurrentChapter]);

  /**
   * Auto-save effect
   * Saves progress every 15 seconds while playing
   */
  useEffect(() => {
    if (!isPlaying || !book) return;

    const interval = setInterval(() => {
      saveProgress(book.id, currentTimeRef.current);
    }, 15000);

    return () => clearInterval(interval);
  }, [isPlaying, book, saveProgress]);

  // Return the public API
  return {
    // State
    book,
    bookFileLocation,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    error,
    chapters,
    currentChapter,

    // Playback control methods
    play,
    pause,
    togglePlayPause,

    // Book management
    setBook,
    setBookFileLocation,
    setDuration,

    // Volume control
    setVolume: handleSetVolume,

    // Seeking
    seek,
    skipForward,
    skipBackward,
    seekToChapter,

    // Progress persistence
    saveProgress,
    loadLastListened,

    // Error management
    clearError: () => setError(null),
  };
}
