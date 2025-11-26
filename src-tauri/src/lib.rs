pub mod audio_player;
pub mod commands;
pub mod db;
pub mod structs;
pub mod utils;

use audio_player::AudioPlayer;
use commands::{add_book, get_all_books, pause, play};
use db::init_db;
use std::sync::Mutex;
use tauri::Manager;
use utils::extract_metadata;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle();

            // Initialize the database connection & pool
            tauri::async_runtime::block_on(async move {
                let pool = init_db(&app_handle).await;
                app_handle.manage(pool);
            });

            // Initialize the audio state
            let mut audio_player = AudioPlayer::new();
            audio_player
                .init()
                .expect("Failed to initialize audio player");
            app.manage(Mutex::new(audio_player));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_all_books,
            extract_metadata,
            add_book,
            play,
            pause,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
