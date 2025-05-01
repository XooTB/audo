// Modules
pub mod audio_lib;
pub mod book_managers;
pub mod database;

// Imports
use crate::database::sqlite::Db;
use book_managers::import_book::import_book;
use database::sqlite::db;

pub async fn initialize_database() -> Db {
    let db_conn = db::establish_connection().await;
    Db(db_conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let db = initialize_database().await;

    tauri::Builder::default()
        .manage(db) // Injects shared DB state
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![import_book])
        .run(tauri::generate_context!())
        .expect("error while running Tauri app");
}
