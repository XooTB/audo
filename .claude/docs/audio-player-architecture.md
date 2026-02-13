# Audio Player Architecture

## Three-Layer Architecture

1. **Backend (Rust/Tauri)**: Audio playback using `rodio` library
2. **State (Zustand)**: Global playback state store
3. **Hook (`useAudioPlayer`)**: Single source of truth for audio commands

**CRITICAL**: Components must NEVER directly call `invoke()` for audio operations. Always use the `useAudioPlayer` hook.

## Backend (Rust/Tauri)

**Files**: `src-tauri/src/audio_player/player.rs`, `src-tauri/src/commands/playback.rs`

**State**: `Mutex<AudioPlayer>` stored in Tauri state for thread-safe access

### AudioPlayer Fields

- `current_track_id: Option<i32>` — ID of loaded book
- `current_track_path: Option<String>` — File path of loaded audio
- `sink: Option<Sink>` — rodio playback sink
- `volume: f32` — Persisted volume level (default 0.5)

### Commands

| Command | Description |
|---------|-------------|
| `play(book_id)` | Load and play audiobook (or resume if already loaded) |
| `pause()` | Pause playback |
| `get_current_timestamp()` | Returns current position as `f64` seconds |
| `seek(position)` | Seek to position in seconds |
| `set_volume(volume)` | Set volume (0.0-1.0) |
| `save_playback_progress(book_id, position, chapter_index?, chapter_position?)` | Persist progress to DB |
| `get_playback_progress(book_id)` | Fetch saved progress for a book |
| `get_last_listened()` | Get last played book + progress |
| `get_chapters(book_id)` | Get chapter list for a book |
| `remove_book(book_id)` | Delete book and cascade-delete progress/chapters |

### Window Close Handler

`lib.rs` registers an `on_window_event` handler that saves current playback position to the database when the window closes, ensuring no progress is lost.

## State Management (Zustand)

**File**: `src/store/CurrentlyListening.ts`

**State fields**: `book`, `bookFileLocation`, `isPlaying`, `currentTime`, `duration`, `progress`, `volume`, `error`, `chapters`, `currentChapter`

**Actions**: Individual setters for each field + `clearPlayer()` to reset all state.

Default volume is 50 (out of 100).

## Frontend Hook: `useAudioPlayer`

**File**: `src/hooks/useAudioPlayer.ts`

Stateless facade over Zustand store. All Tauri audio commands invoked here.

### Progress Polling (500ms)

- Polls `get_current_timestamp()` every 500ms when `isPlaying` is true
- Updates `currentTime` and `progress` percentage in store
- Detects chapter changes by comparing current timestamp against chapter boundaries
- Cleans up interval when paused or unmounted

### Auto-Save (15s)

- Saves progress to DB every 15 seconds while playing
- Also saves on pause, book switch, and seek-while-paused

### Chapter Navigation

- `seekToChapter(chapterIndex)` — Saves current progress, then seeks to chapter start time
- If paused, starts playback first then seeks (with 100ms delay for sink initialization)
- Chapter detection runs during polling via `findCurrentChapter()` helper

### Resume Logic

When `play(bookId)` is called:
1. Save current book's progress if switching books
2. Fetch saved progress from DB
3. Start playback via backend
4. Fetch chapters
5. If saved progress exists, attempt chapter-based resume (verify `chapter.start_time + chapter_position` matches absolute position within 2s tolerance)
6. Fall back to position-based chapter detection
7. Seek to resume position after 100ms sink init delay

### `loadLastListened()`

Called on app startup from `App.tsx`. Loads the last-played book into the AudioBar UI without auto-playing. Populates book info, chapters, and resume position in the store.

### Public API

**State**: `book`, `bookFileLocation`, `isPlaying`, `currentTime`, `duration`, `progress`, `volume`, `error`, `chapters`, `currentChapter`

**Playback**: `play(bookId)`, `pause()`, `togglePlayPause()`

**Seeking**: `seek(seconds)`, `skipForward(seconds=30)`, `skipBackward(seconds=10)`, `seekToChapter(chapterIndex)`

**Book mgmt**: `setBook`, `setBookFileLocation`, `setDuration`

**Volume**: `setVolume(0-100)` (converts to 0.0-1.0 for backend)

**Progress**: `saveProgress(bookId, position)`, `loadLastListened()`

**Error**: `clearError()`

## AudioBar UI

**File**: `src/sections/AudioBar.tsx`

- When chapters are available, progress bar and time display show chapter-relative values (elapsed within chapter, chapter duration)
- Clicking the progress bar seeks within the current chapter (or within full duration if no chapters)
- Chapter selector dropdown allows jumping to any chapter
- Desktop and mobile (sheet-based) layouts both support chapter UI

## Rules

1. Never invoke audio commands directly — always use `useAudioPlayer` hook
2. Use individual Zustand selectors to prevent re-renders
3. Polling is conditional (only when playing)
4. Methods use `useCallback` with refs to avoid unnecessary re-renders
5. Progress is persisted on pause, every 15s, on book switch, and on window close
