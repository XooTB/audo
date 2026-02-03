import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentlyListeningStore } from "@/store/CurrentlyListening";

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

  /**
   * Play a book by ID
   * Invokes backend play command and updates state
   */
  const play = useCallback(
    async (bookId: number) => {
      try {
        setError(null);
        await invoke("play", { bookId });
        setIsPlaying(true);
      } catch (error) {
        console.error("Play error:", error);
        setError(error instanceof Error ? error.message : String(error));
        setIsPlaying(false);
      }
    },
    [setIsPlaying, setError]
  );

  /**
   * Pause playback
   * Invokes backend pause command and updates state
   */
  const pause = useCallback(async () => {
    try {
      setError(null);
      await invoke("pause");
      setIsPlaying(false);
    } catch (error) {
      console.error("Pause error:", error);
      setError(error instanceof Error ? error.message : String(error));
    }
  }, [setIsPlaying, setError]);

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
   * Currently only updates store - backend command TODO
   */
  const handleSetVolume = useCallback(
    (newVolume: number) => {
      setVolume(Math.max(0, Math.min(100, newVolume)));
      // TODO: Backend command for volume control when available
      // await invoke("set_volume", { volume: newVolume });
    },
    [setVolume]
  );

  /**
   * Seek to specific position (placeholder)
   * Backend command not yet implemented
   */
  const seek = useCallback(
    async (seconds: number) => {
      console.warn("Seek not yet implemented in backend");
      // TODO: Backend command for seeking when available
      // await invoke("seek", { position: seconds });
      // setCurrentTime(seconds);
    },
    []
  );

  /**
   * Skip forward by N seconds (placeholder)
   * Backend command not yet implemented
   */
  const skipForward = useCallback(
    async (seconds: number = 30) => {
      console.warn("Skip forward not yet implemented in backend");
      // TODO: Backend command for seeking when available
      // const newTime = currentTime + seconds;
      // await seek(newTime);
    },
    []
  );

  /**
   * Skip backward by N seconds (placeholder)
   * Backend command not yet implemented
   */
  const skipBackward = useCallback(
    async (seconds: number = 10) => {
      console.warn("Skip backward not yet implemented in backend");
      // TODO: Backend command for seeking when available
      // const newTime = Math.max(0, currentTime - seconds);
      // await seek(newTime);
    },
    []
  );

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
        // Don't set error state for polling failures - they're expected during state changes
      }
    };

    // Poll immediately, then every 500ms
    pollTimestamp();
    const interval = setInterval(pollTimestamp, 500);

    return () => clearInterval(interval);
  }, [isPlaying, duration, setCurrentTime, setProgress]);

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
    
    // Seeking (placeholders)
    seek,
    skipForward,
    skipBackward,
    
    // Error management
    clearError: () => setError(null),
  };
}
