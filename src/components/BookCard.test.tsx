import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import BookCard from "./BookCard";
import type { Book } from "@/types/book.d";

const mockBook: Book = {
  id: 1,
  name: "Project Hail Mary",
  file_location: "/tmp/hailmary.m4b",
  cover_image: "",
  author: "Andy Weir",
  narrator: "Ray Porter",
  duration: 57600,
  size: 500000,
  content_id: null,
  identity_method: null,
  asin: null,
  isbn: null,
};

// Default mock state
let mockAudioPlayer = {
  book: null as Book | null,
  bookFileLocation: null as string | null,
  isPlaying: false,
  play: vi.fn(),
  pause: vi.fn(),
  setBook: vi.fn(),
  setBookFileLocation: vi.fn(),
  setDuration: vi.fn(),
};

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => mockAudioPlayer,
}));

beforeEach(() => {
  mockAudioPlayer = {
    book: null,
    bookFileLocation: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    setBook: vi.fn(),
    setBookFileLocation: vi.fn(),
    setDuration: vi.fn(),
  };
});

describe("BookCard", () => {
  it("renders book title and author", () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText("Project Hail Mary")).toBeInTheDocument();
    expect(screen.getByText("Andy Weir")).toBeInTheDocument();
  });

  it("opens modal dialog on click", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    // Click the card
    await user.click(screen.getByText("Project Hail Mary"));

    // Modal should show book details
    expect(screen.getByText("Author:")).toBeInTheDocument();
    expect(screen.getByText("Narrator:")).toBeInTheDocument();
    expect(screen.getByText("Duration:")).toBeInTheDocument();
    expect(screen.getByText("Ray Porter")).toBeInTheDocument();
    expect(screen.getByText("16h 0m")).toBeInTheDocument();
  });

  it("shows remove button in modal", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    await user.click(screen.getByText("Project Hail Mary"));

    expect(screen.getByText("Remove from Library")).toBeInTheDocument();
  });

  it("shows confirm removal button after clicking remove", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    await user.click(screen.getByText("Project Hail Mary"));
    await user.click(screen.getByText("Remove from Library"));

    expect(screen.getByText("Confirm Removal")).toBeInTheDocument();
  });

  it("shows Playing badge when this book is currently playing", () => {
    mockAudioPlayer.bookFileLocation = mockBook.file_location;
    mockAudioPlayer.isPlaying = true;

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText("Playing")).toBeInTheDocument();
  });

  it("shows Paused badge when this book is loaded but paused", () => {
    mockAudioPlayer.bookFileLocation = mockBook.file_location;
    mockAudioPlayer.isPlaying = false;

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText("Paused")).toBeInTheDocument();
  });
});
