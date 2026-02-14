# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Audo is a cross-platform audiobook reader built with Tauri v2 + React 19 + TypeScript. The frontend uses Vite, shadcn/ui (new-york style), and Tailwind CSS v4. The backend is Rust with SQLite (via sqlx) and audio playback via rodio. FFmpeg/FFprobe binaries are bundled as sidecar executables for metadata extraction.

## Development Commands

```bash
# Run the full app (starts both Vite dev server and Tauri backend)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only (no Tauri backend)
npm run dev

# Type-check and build frontend
npm run build

# Run all frontend tests (watch mode)
npm test

# Run all frontend tests (single run, for CI)
npm run test:run

# Run a single frontend test file
npx vitest run path/to/file.test.ts

# Run all Rust tests
cd src-tauri && cargo test

# Run specific Rust test module
cd src-tauri && cargo test --lib module::tests
```

For detailed testing conventions, see [testing-guide.md](.claude/docs/testing-guide.md).

## Architecture

### Three-Layer Audio Playback

1. **Rust backend** (`src-tauri/src/audio_player/player.rs`): Audio playback via `rodio`, stored as `Mutex<AudioPlayer>` in Tauri state. Supports play, pause, seek, volume control, and timestamp queries.
2. **Zustand store** (`src/store/CurrentlyListening.ts`): Global playback state (book, isPlaying, currentTime, duration, progress, volume, error, chapters, currentChapter)
3. **Hook** (`src/hooks/useAudioPlayer.ts`): Stateless facade that invokes Tauri commands, manages progress polling (500ms interval when playing), auto-saves progress every 15s, and handles chapter-based navigation

**Critical rule**: Components must NEVER directly call `invoke()` for audio operations. Always use the `useAudioPlayer` hook.

For detailed architecture see [audio-player-architecture.md](.claude/docs/audio-player-architecture.md).

### Rust Module Structure

```
src-tauri/src/
├── lib.rs              # App setup, plugin registration, command handler registration, window close handler
├── main.rs             # Entry point only
├── commands/           # Tauri commands (mod.rs uses pub use *::* for flat re-exports)
│   ├── books.rs        # get_all_books, add_book, remove_book, get_chapters
│   ├── playback.rs     # play, pause, get_current_timestamp, seek, set_volume
│   └── progress.rs     # save_playback_progress, get_playback_progress, get_last_listened
├── audio_player/       # rodio-based audio playback
├── database/           # SQLite via sqlx
│   ├── connection.rs   # Pool init, auto-migration
│   └── queries.rs      # SQL queries (books, progress, chapters)
├── models/             # Data structs (serde + sqlx derives)
│   ├── book.rs         # Book (includes content_id, asin, isbn fields)
│   ├── chapter.rs      # Chapter (book_id, chapter_index, start/end_time, title)
│   └── playback_progress.rs  # PlaybackProgress (position, chapter_index, chapter_position)
└── utils/
    ├── extract_metadata.rs   # ffprobe sidecar for metadata + chapter extraction
    └── content_id.rs         # Content identity generation (SHA-256 hash of normalized title+author+duration)
```

Adding a new Tauri command: add the function in the appropriate `commands/*.rs` file, then register it in `lib.rs` `invoke_handler`. Wildcard re-exports in `mod.rs` mean no intermediate updates needed.

### Frontend Structure

- `src/pages/` - Route pages: Home, Library, Settings
- `src/sections/` - Layout sections: Header, AudioBar (persistent bottom player)
- `src/components/` - Reusable components; `ui/` contains shadcn components
- `src/store/` - Zustand stores
- `src/hooks/` - Custom hooks (useAudioPlayer, use-toast)
- `src/types/` - TypeScript type definitions (Book, Chapter, PlaybackProgress)
- Path alias: `@/` maps to `./src/`

### Database

SQLite database stored in the app data directory. Migrations live in `src-tauri/migrations/` and run automatically on startup via sqlx's embedded migrator. Database columns use snake_case.

**Tables:**
- `audio_books` — Book metadata (name, author, narrator, duration, file_location, cover_image, content_id, identity_method, asin, isbn)
- `playback_progress` — Per-book playback position with chapter-level tracking (position, chapter_index, chapter_position, last_listened_at). Uses `ON CONFLICT(book_id) DO UPDATE` for upserts.
- `chapters` — Chapter markers extracted from audiobook files (book_id, chapter_index, start_time, end_time, title). Foreign key cascades on book delete.

### Progress Tracking & Persistence

Progress is tracked at two levels — overall book position and chapter-relative position:

- **Auto-save**: Progress saves to SQLite every 15 seconds while playing, on pause, on book switch, and on window close
- **Resume**: On play, the hook fetches saved progress and seeks to it after the audio sink initializes
- **Chapter-based resume**: If chapter data is available, progress is reconstructed from `chapter.start_time + chapter_position` with a 2-second tolerance check against the absolute position
- **Last listened**: On app launch, `loadLastListened()` restores the last-played book into the AudioBar (without auto-playing)

### Content Identity

Books are identified across devices using a deterministic content ID (SHA-256 hash of normalized title + author + duration bucketed to 60s). This enables matching the same audiobook from different sources. Generated in `src-tauri/src/utils/content_id.rs`.

### Progress Sync Architecture (planned)

Audo will support cross-device progress synchronization through a central service:

- **Central sync service**: Remote server that stores user progress data
- **Authentication**: Users must sign up and log in to enable sync
- **Manual file management**: Users are responsible for copying audiobook files to each device
- **Automatic sync**: Progress syncs to the service when internet is available
- **Device-specific libraries**: Each device maintains its own local library; the cloud only stores progress, not files
- **Sync requirement**: A book must be imported into a device's local library to receive synced progress for that book
- **Local-first**: Always sync local SQLite first; on launch, use whichever timestamp is newer

The device library and cloud library are independent—sync only updates progress for books that exist locally.

### Routing

React Router v7 with BrowserRouter. Routes defined in `App.tsx`: `/` (Home), `/settings`, `/library`.

## Code Style

- **TypeScript**: camelCase variables, `const` over `let`, top-level functions use `function` keyword, nested functions use arrow syntax. Always use type annotations for function params and return values. Use interfaces for object types.
- **React**: Each component in its own `.tsx` file. Prefer local state unless global state is needed. Use individual Zustand selectors to prevent unnecessary re-renders.
- **Rust**: Descriptive module names (`database` not `db`). Split files into submodules at ~500 lines. Wildcard re-exports (`pub use module::*`) in `mod.rs` files.
