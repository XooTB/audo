import { useCurrentlyListeningStore } from "./CurrentlyListening";
import type { Book } from "@/types/book.d";
import type { Chapter } from "@/types/chapter.d";

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

const mockChapter: Chapter = {
  id: 1,
  book_id: 1,
  chapter_index: 0,
  start_time: 0,
  end_time: 600,
  title: "Chapter 1",
};

beforeEach(() => {
  useCurrentlyListeningStore.getState().clearPlayer();
  // Reset volume since clearPlayer preserves it
  useCurrentlyListeningStore.getState().setVolume(50);
});

describe("CurrentlyListeningStore", () => {
  it("has correct initial state", () => {
    const state = useCurrentlyListeningStore.getState();
    expect(state.book).toBeNull();
    expect(state.bookFileLocation).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.volume).toBe(50);
    expect(state.error).toBeNull();
    expect(state.chapters).toEqual([]);
    expect(state.currentChapter).toBeNull();
  });

  it("setBook updates book", () => {
    useCurrentlyListeningStore.getState().setBook(mockBook);
    expect(useCurrentlyListeningStore.getState().book).toEqual(mockBook);
  });

  it("clearPlayer resets all state except volume", () => {
    const store = useCurrentlyListeningStore.getState();
    store.setBook(mockBook);
    store.setBookFileLocation("/tmp/test.m4b");
    store.setIsPlaying(true);
    store.setCurrentTime(120);
    store.setDuration(3600);
    store.setProgress(50);
    store.setVolume(75);
    store.setError("some error");
    store.setChapters([mockChapter]);
    store.setCurrentChapter(mockChapter);

    useCurrentlyListeningStore.getState().clearPlayer();
    const state = useCurrentlyListeningStore.getState();

    expect(state.book).toBeNull();
    expect(state.bookFileLocation).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
    expect(state.chapters).toEqual([]);
    expect(state.currentChapter).toBeNull();
    // Volume is preserved through clearPlayer
    expect(state.volume).toBe(75);
  });

  it("setIsPlaying updates playing state", () => {
    useCurrentlyListeningStore.getState().setIsPlaying(true);
    expect(useCurrentlyListeningStore.getState().isPlaying).toBe(true);

    useCurrentlyListeningStore.getState().setIsPlaying(false);
    expect(useCurrentlyListeningStore.getState().isPlaying).toBe(false);
  });

  it("setCurrentTime updates time", () => {
    useCurrentlyListeningStore.getState().setCurrentTime(120.5);
    expect(useCurrentlyListeningStore.getState().currentTime).toBe(120.5);
  });

  it("setDuration updates duration", () => {
    useCurrentlyListeningStore.getState().setDuration(7200);
    expect(useCurrentlyListeningStore.getState().duration).toBe(7200);
  });

  it("setProgress updates progress", () => {
    useCurrentlyListeningStore.getState().setProgress(42.5);
    expect(useCurrentlyListeningStore.getState().progress).toBe(42.5);
  });

  it("setVolume updates volume", () => {
    useCurrentlyListeningStore.getState().setVolume(80);
    expect(useCurrentlyListeningStore.getState().volume).toBe(80);
  });

  it("setError updates error", () => {
    useCurrentlyListeningStore.getState().setError("Something went wrong");
    expect(useCurrentlyListeningStore.getState().error).toBe("Something went wrong");

    useCurrentlyListeningStore.getState().setError(null);
    expect(useCurrentlyListeningStore.getState().error).toBeNull();
  });

  it("setChapters updates chapters", () => {
    useCurrentlyListeningStore.getState().setChapters([mockChapter]);
    expect(useCurrentlyListeningStore.getState().chapters).toEqual([mockChapter]);
  });

  it("setCurrentChapter updates current chapter", () => {
    useCurrentlyListeningStore.getState().setCurrentChapter(mockChapter);
    expect(useCurrentlyListeningStore.getState().currentChapter).toEqual(mockChapter);

    useCurrentlyListeningStore.getState().setCurrentChapter(null);
    expect(useCurrentlyListeningStore.getState().currentChapter).toBeNull();
  });

  it("setBookFileLocation updates file location", () => {
    useCurrentlyListeningStore.getState().setBookFileLocation("/new/path.m4b");
    expect(useCurrentlyListeningStore.getState().bookFileLocation).toBe("/new/path.m4b");

    useCurrentlyListeningStore.getState().setBookFileLocation(null);
    expect(useCurrentlyListeningStore.getState().bookFileLocation).toBeNull();
  });
});
