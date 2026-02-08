import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";
import type { Book } from "@/types/book.d";
import type { PlaybackProgress } from "@/types/playbackProgress.d";

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

  // Get store setters
  const setBook = useCurrentlyListeningStore((state) => state.setBook);
  const setBookFileLocation = useCurrentlyListeningStore((state) => state.setBookFileLocation);
  const setIsPlaying = useCurrentlyListeningStore((state) => state.setIsPlaying);
  const setCurrentTime = useCurrentlyListeningStore((state) => state.setCurrentTime);
  const setDuration = useCurrentlyListeningStore((state) => state.setDuration);
  const setProgress = useCurrentlyListeningStore((state) => state.setProgress);
  const setVolume = useCurrentlyListeningStore((state) => state.setVolume);
  const setError = useCurrentlyListeningStore((state) => state.setError);

  // Refs for values needed in callbacks without causing re-renders
  const bookRef = useRef(book);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  bookRef.current = book;
  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;

  /**
   * Save current playback progress to the database
   */
  const saveProgress = useCallback(
    async (bookId: number, position: number) => {
      try {
        await invoke("save_playback_progress", { bookId, position });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    []
  );

  /**
   * Seek to specific position in seconds
   */
  const seek = useCallback(
    async (seconds: number) => {
      try {
        await invoke("seek", { position: seconds });
        setCurrentTime(seconds);
      } catch (err) {
        console.error("Seek error:", err);
      }
    },
    [setCurrentTime]
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

        // If there's saved progress and we loaded a new source, seek to it
        if (savedProgress && savedProgress.position > 0) {
          // Small delay to let the sink initialize before seeking
          setTimeout(async () => {
            try {
              await invoke("seek", { position: savedProgress.position });
              setCurrentTime(savedProgress.position);
            } catch (err) {
              console.error("Failed to seek to saved position:", err);
            }
          }, 100);
        }
      } catch (error) {
        console.error("Play error:", error);
        setError(error instanceof Error ? error.message : String(error));
        setIsPlaying(false);
      }
    },
    [setIsPlaying, setError, setCurrentTime, saveProgress]
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
   */
  const handleSetVolume = useCallback(
    (newVolume: number) => {
      setVolume(Math.max(0, Math.min(100, newVolume)));
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
        setCurrentTime(lastProgress.position);
        if (lastBook.duration > 0) {
          setProgress((lastProgress.position / lastBook.duration) * 100);
        }
      }
    } catch (err) {
      console.error("Failed to load last listened book:", err);
    }
  }, [setBook, setBookFileLocation, setDuration, setCurrentTime, setProgress]);

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
      } catch (error) {
        console.error("Timestamp poll error:", error);
      }
    };

    // Poll immediately, then every 500ms
    pollTimestamp();
    const interval = setInterval(pollTimestamp, 500);

    return () => clearInterval(interval);
  }, [isPlaying, duration, setCurrentTime, setProgress]);

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

    // Progress persistence
    saveProgress,
    loadLastListened,

    // Error management
    clearError: () => setError(null),
  };
}
