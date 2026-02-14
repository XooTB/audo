import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AudioBar from "./AudioBar";
import type { Book } from "@/types/book.d";
import type { Chapter } from "@/types/chapter.d";

const mockBook: Book = {
  id: 1,
  name: "Test Audiobook",
  file_location: "/tmp/test.m4b",
  cover_image: "",
  author: "Test Author",
  narrator: "Test Narrator",
  duration: 7200,
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

// Default mock state
let mockState = {
  book: null as Book | null,
  bookFileLocation: null as string | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 50,
  play: vi.fn(),
  pause: vi.fn(),
  setVolume: vi.fn(),
  skipBackward: vi.fn(),
  skipForward: vi.fn(),
  seek: vi.fn(),
  chapters: [] as Chapter[],
  currentChapter: null as Chapter | null,
  seekToChapter: vi.fn(),
};

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => mockState,
}));

beforeEach(() => {
  mockState = {
    book: null,
    bookFileLocation: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    play: vi.fn(),
    pause: vi.fn(),
    setVolume: vi.fn(),
    skipBackward: vi.fn(),
    skipForward: vi.fn(),
    seek: vi.fn(),
    chapters: [],
    currentChapter: null,
    seekToChapter: vi.fn(),
  };
});

describe("AudioBar", () => {
  it("renders empty state when no book is loaded", () => {
    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("No book selected").length).toBeGreaterThan(0);
  });

  it("renders book info when a book is loaded", () => {
    mockState.book = mockBook;
    mockState.bookFileLocation = mockBook.file_location;
    mockState.duration = mockBook.duration;

    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Test Audiobook").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Author").length).toBeGreaterThan(0);
  });

  it("shows play button when not playing", () => {
    mockState.book = mockBook;
    mockState.bookFileLocation = mockBook.file_location;
    mockState.isPlaying = false;

    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    // Play icons should be present (both desktop and mobile)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("formats time as MM:SS when under an hour", () => {
    mockState.book = mockBook;
    mockState.bookFileLocation = mockBook.file_location;
    mockState.duration = 600; // 10 minutes
    mockState.currentTime = 125; // 2:05

    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("2:05").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10:00").length).toBeGreaterThan(0);
  });

  it("formats time as HH:MM:SS when over an hour", () => {
    mockState.book = mockBook;
    mockState.bookFileLocation = mockBook.file_location;
    mockState.duration = 7200; // 2 hours
    mockState.currentTime = 3661; // 1:01:01

    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("1:01:01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2:00:00").length).toBeGreaterThan(0);
  });

  it("shows chapter info when chapters are available", () => {
    mockState.book = mockBook;
    mockState.bookFileLocation = mockBook.file_location;
    mockState.chapters = mockChapters;
    mockState.currentChapter = mockChapters[0];
    mockState.currentTime = 300;

    render(
      <MemoryRouter>
        <AudioBar />
      </MemoryRouter>
    );

    // Chapter display should show elapsed time relative to chapter
    // Current time 300 - chapter start 0 = 300 seconds = 5:00
    expect(screen.getAllByText("5:00").length).toBeGreaterThan(0);
    // Chapter duration = 600 - 0 = 600 seconds = 10:00
    expect(screen.getAllByText("10:00").length).toBeGreaterThan(0);
  });
});
