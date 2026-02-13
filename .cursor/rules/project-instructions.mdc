---
description: "Project instructions"
alwaysApply: false
applyIntelligently: true
---

# About
- A modern cross-platform audiobook reader built with tauri + react.
- Shadcn + tailwindcss as the component library and styling framework. 


## Code Style

### React
-- All new components must be created in dedicated tsx files
-- Utilize local states unless global state is needed for functionality. 

### Tauri
-- All database columns must be in snake_case. 
-- All database migrations should be clearly labled and outlined.

#### Rust Module Structure
Follow this structure for organizing Rust code in `src-tauri/src/`:

**Module Organization:**
```
src-tauri/src/
├── lib.rs              (setup + wildcard imports)
├── main.rs             (entry point only)
├── commands/           (Tauri commands)
│   ├── mod.rs          (pub use books::*; pub use playback::*)
│   ├── books.rs
│   └── playback.rs
├── audio_player/       (audio playback logic)
├── database/           (DB connection & queries)
│   ├── mod.rs          (pub use connection::*; pub use queries::*)
│   ├── connection.rs
│   └── queries.rs
├── models/             (data structures)
└── utils/              (utilities)
```

**Key Principles:**
1. **Wildcard re-exports**: Use `pub use module::*` in `mod.rs` files to avoid multi-level re-export chains
2. **Flat hierarchy**: Keep modules 1-2 levels deep; flatten when possible
3. **Adding commands**: Only requires updating the command file and registering in `lib.rs` - no intermediate `mod.rs` updates needed
4. **File splitting**: Split files into submodules when they exceed ~500 lines
5. **Clear naming**: Use descriptive names (`database` not `db`, `models` not `structs`)

**Example - Adding a new command:**
```rust
// 1. Add function in commands/playback.rs
#[tauri::command]
pub async fn seek(player: State<Mutex<AudioPlayer>>, position: u64) -> Result<(), String> {
    // implementation
}

// 2. Register in lib.rs (automatically available via wildcard import)
.invoke_handler(tauri::generate_handler![
    play, pause, seek  // Just add here
])
``` 

