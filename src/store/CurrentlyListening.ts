import { Book } from "@/types/book.d";
import { create } from "zustand";

interface CurrentlyListeningStore {
  book: Book | null;
  setBook: (book: Book) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTime: number;
  setCurrentTime: (currentTime: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  progress: number;
  setProgress: (progress: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null> | null;
  setAudioRef: (
    audioRef: React.RefObject<HTMLAudioElement | null> | null
  ) => void;
}

export const useCurrentlyListeningStore = create<CurrentlyListeningStore>(
  (set) => ({
    book: null as Book | null,
    setBook: (book: Book) => set({ book }),
    isPlaying: false,
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
    currentTime: 0,
    setCurrentTime: (currentTime: number) => set({ currentTime }),
    duration: 0,
    setDuration: (duration: number) => set({ duration }),
    progress: 0,
    setProgress: (progress: number) => set({ progress }),
    audioRef: null as React.RefObject<HTMLAudioElement | null> | null,
    setAudioRef: (audioRef: React.RefObject<HTMLAudioElement | null> | null) =>
      set({ audioRef }),
  })
);
