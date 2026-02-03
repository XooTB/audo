---
description: "Audio Player Architecture and Implementation"
alwaysApply: false
applyIntelligently: true
---

# Audio Player Architecture

## Three-Layer Architecture

1. **Backend (Rust/Tauri)**: Audio playback using `rodio` library
2. **State (Zustand)**: Global playback state store
3. **Hook (`useAudioPlayer`)**: Single source of truth for audio commands

**CRITICAL**: Components must NEVER directly call `invoke()` for audio operations. Always use the `useAudioPlayer` hook.

## Backend (Rust/Tauri)

**Files**: `src-tauri/src/audio_player/player.rs`, `src-tauri/src/commands/playback/play.rs`

**State**: `Mutex<AudioPlayer>` stored in Tauri state for thread-safe access

### Commands

- `play(book_id: i32)` - Load and play audiobook (or resume if already loaded)
- `pause()` - Pause playback
- `get_current_timestamp()` - Returns current position as `f64` seconds

## State Management (Zustand)

**File**: `src/store/CurrentlyListening.ts`

**State**: `book`, `bookFileLocation`, `isPlaying`, `currentTime`, `duration`, `progress`, `volume`, `error`

## Frontend Hook: `useAudioPlayer`

**File**: `src/hooks/useAudioPlayer.ts`

Stateless facade over Zustand store. All Tauri audio commands invoked here.

### Automatic Progress Polling

- Polls `get_current_timestamp()` every 500ms when `isPlaying` is true
- Updates `currentTime` and `progress` percentage in store
- Cleans up interval when paused or unmounted
- Polling errors are logged but don't set error state

### API

**Playback**: `play(bookId)`, `pause()`, `togglePlayPause()`  
**State**: `book`, `isPlaying`, `currentTime`, `duration`, `progress`, `volume`, `error`  
**Setters**: `setBook`, `setBookFileLocation`, `setDuration`, `setVolume`, `clearError`  
**TODO**: `seek`, `skipForward`, `skipBackward` (backend not implemented)

## Component Usage

```typescript
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const { isPlaying, currentTime, togglePlayPause } = useAudioPlayer();
```

No need to import `invoke`, manage polling, update store, or handle errors manually.

## Rules

1. Never invoke audio commands directly—always use `useAudioPlayer` hook
2. Use individual Zustand selectors to prevent re-renders
3. Polling is conditional (only when playing)
4. Methods use `useCallback` for stability
