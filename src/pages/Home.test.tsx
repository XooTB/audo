import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import { invoke } from "@tauri-apps/api/core";
import type { Mock } from "vitest";
import type { Book } from "@/types/book.d";

const mockInvoke = invoke as Mock;

const mockBook: Book = {
  id: 1,
  name: "The Great Gatsby",
  file_location: "/tmp/gatsby.m4b",
  cover_image: "",
  author: "F. Scott Fitzgerald",
  narrator: "Jake Gyllenhaal",
  duration: 18000,
  size: 200000,
  content_id: null,
  identity_method: null,
  asin: null,
  isbn: null,
};

// Mock useAudioPlayer since BookCard depends on it
vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    book: null,
    bookFileLocation: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    setBook: vi.fn(),
    setBookFileLocation: vi.fn(),
    setDuration: vi.fn(),
  }),
}));

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("Home", () => {
  it("shows loading skeletons initially", () => {
    // Never resolve the promise to keep loading state
    mockInvoke.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Skeleton elements should be rendered (12 of them based on the code)
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns empty array", async () => {
    mockInvoke.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No audiobooks yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Start building your library by importing your first audiobook")
    ).toBeInTheDocument();
  });

  it("renders book cards when books exist", async () => {
    mockInvoke.mockResolvedValue([mockBook]);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    });

    expect(screen.getByText("F. Scott Fitzgerald")).toBeInTheDocument();
  });

  it("renders multiple book cards", async () => {
    const books: Book[] = [
      mockBook,
      {
        ...mockBook,
        id: 2,
        name: "1984",
        author: "George Orwell",
        file_location: "/tmp/1984.m4b",
      },
    ];
    mockInvoke.mockResolvedValue(books);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    });

    expect(screen.getByText("1984")).toBeInTheDocument();
  });
});
