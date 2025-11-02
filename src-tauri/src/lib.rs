pub mod commands;
pub mod db;
pub mod utils;

use commands::{add_book, get_all_books};
use db::init_db;
use tauri::Manager;
use utils::extract_metadata;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            // Initialize the database connection & pool
            tauri::async_runtime::block_on(async move {
                let pool = init_db(&app_handle).await;
                app_handle.manage(pool);
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_all_books,
            extract_metadata,
            add_book
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
