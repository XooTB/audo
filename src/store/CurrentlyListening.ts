import { Book } from "@/types/book.d";
import { Chapter } from "@/types/chapter.d";
import { create } from "zustand";

interface CurrentlyListeningStore {
  book: Book | null;
  setBook: (book: Book) => void;
  bookFileLocation: string | null;
  setBookFileLocation: (bookFileLocation: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTime: number;
  setCurrentTime: (currentTime: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  progress: number;
  setProgress: (progress: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  error: string | null;
  setError: (error: string | null) => void;
  chapters: Chapter[];
  setChapters: (chapters: Chapter[]) => void;
  currentChapter: Chapter | null;
  setCurrentChapter: (chapter: Chapter | null) => void;
}

export const useCurrentlyListeningStore = create<CurrentlyListeningStore>(
  (set) => ({
    book: null as Book | null,
    setBook: (book: Book) => set({ book }),
    bookFileLocation: null as string | null,
    setBookFileLocation: (bookFileLocation: string | null) => set({ bookFileLocation }),
    isPlaying: false,
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
    currentTime: 0,
    setCurrentTime: (currentTime: number) => set({ currentTime }),
    duration: 0,
    setDuration: (duration: number) => set({ duration }),
    progress: 0,
    setProgress: (progress: number) => set({ progress }),
    volume: 50,
    setVolume: (volume: number) => set({ volume }),
    error: null as string | null,
    setError: (error: string | null) => set({ error }),
    chapters: [] as Chapter[],
    setChapters: (chapters: Chapter[]) => set({ chapters }),
    currentChapter: null as Chapter | null,
    setCurrentChapter: (chapter: Chapter | null) => set({ currentChapter: chapter }),
  })
);
