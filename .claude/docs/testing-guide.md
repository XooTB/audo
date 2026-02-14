# Testing Guide

## 1. Running Tests

### Rust
```bash
cd src-tauri && cargo test          # all tests
cargo test test_name                # single test
cargo test -- --nocapture           # with stdout
cargo test --lib module::tests      # specific module
```

### Frontend
```bash
npm test                            # watch mode
npm run test:run                    # single run
npx vitest run path/to/file.test.ts # single file
```

## 2. Writing Rust Unit Tests

Convention: co-located `#[cfg(test)] mod tests` at the bottom of each source file.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_my_function() {
        let result = my_function("input");
        assert_eq!(result, expected);
    }
}
```

- Import the parent module with `use super::*;`
- Use `#[test]` for sync tests, `#[tokio::test]` for async tests
- Use `assert!`, `assert_eq!`, `assert!(result.is_err())` for assertions

## 3. Writing Rust Database Tests

Use `#[sqlx::test(migrations = "./migrations")]` — auto-creates ephemeral SQLite DB per test.

```rust
#[sqlx::test(migrations = "./migrations")]
async fn test_query(pool: SqlitePool) {
    // Insert test data
    let book_id = insert_test_book(&pool, "Test Book").await;
    // Call the function under test
    let result = fetch_book(&pool, book_id).await.unwrap();
    // Assert
    assert_eq!(result.name, "Test Book");
}
```

- Test function receives `pool: SqlitePool` as an argument
- Use the `insert_test_book` helper pattern for setting up test data
- Each test is fully isolated — no shared state, no cleanup needed

## 4. Writing Frontend Store Tests (Zustand)

No React rendering needed — call `store.getState()` directly.

```typescript
import { useCurrentlyListeningStore } from './CurrentlyListening';

beforeEach(() => {
  useCurrentlyListeningStore.getState().clearPlayer();
});

it('should update state', () => {
  useCurrentlyListeningStore.getState().setIsPlaying(true);
  expect(useCurrentlyListeningStore.getState().isPlaying).toBe(true);
});
```

## 5. Writing Frontend Hook Tests

**Pure functions:** Export and test directly with `import { fn } from './hook'`.

**Hooks with state:** Use `renderHook` from `@testing-library/react`, wrap mutations in `act()`.

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

it('should do something', async () => {
  const { result } = renderHook(() => useMyHook());
  await act(async () => {
    await result.current.someMethod();
  });
  expect(result.current.someState).toBe(expected);
});
```

- **Async hooks:** Use `waitFor` for assertions that depend on async operations
- **Timers:** Use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for interval-based logic

## 6. Mocking Tauri `invoke()`

Global mock is set up in `src/test/setup.ts` — `invoke` is always a `vi.fn()`.

```typescript
import { invoke } from '@tauri-apps/api/core';
const mockInvoke = invoke as Mock;

beforeEach(() => { mockInvoke.mockReset(); });

// Mock by command name for hooks that call multiple commands:
mockInvoke.mockImplementation(async (cmd: string) => {
  switch (cmd) {
    case 'get_all_books': return [mockBook];
    case 'play': return undefined;
    default: throw new Error(`Unmocked: ${cmd}`);
  }
});

// Simple single-command components:
mockInvoke.mockResolvedValueOnce([mockBook]);
```

## 7. Writing React Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import MyComponent from './MyComponent';

vi.mock('@/hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({ book: null, isPlaying: false, play: vi.fn() }),
}));

it('renders correctly', () => {
  render(<MemoryRouter><MyComponent /></MemoryRouter>);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

- Mock `useAudioPlayer` at the module level to control state
- Wrap components in `<MemoryRouter>` for routing
- Use `screen.getByText()`, `screen.getByRole()` for queries
- Use `userEvent` over `fireEvent` for realistic interactions

## 8. Test File Naming & Location

- **Rust:** `#[cfg(test)] mod tests` inside the source file
- **Frontend:** `ComponentName.test.tsx` / `hookName.test.ts` next to the source file
- **Integration tests:** `hookName.integration.test.ts` for heavier hook tests with `renderHook`

## 9. What to Test (Decision Guide)

| Code Type | Test? | How |
|-----------|-------|-----|
| Pure function (no deps) | Always | Direct import, assert output |
| Database query | Always | `#[sqlx::test]` with ephemeral DB |
| Zustand store | Yes | Direct `getState()` calls |
| Custom hook (complex) | Yes | `renderHook` + mocked invoke |
| React component (UI) | When it has logic | RTL render + user interaction |
| Tauri command handler | No | Tested via database/hook tests |
| Audio playback (rodio) | No | Hardware-dependent |
| shadcn/Radix components | No | Tested upstream |
| CSS/Tailwind styling | No | Visual, not behavioral |

## 10. Adding a New Tauri Command (Test Checklist)

1. If the command calls a database query — add a `#[sqlx::test]` for that query in `queries.rs`
2. If the command is called from the frontend — add the command to the mock switch in the relevant hook test
3. If a new hook wraps the command — write a `renderHook` test for the hook
4. If a component displays data from the command — write a component test with mocked data
