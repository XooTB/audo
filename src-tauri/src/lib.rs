// Modules
pub mod audio_lib;
pub mod book_managers;
pub mod database;

// Imports
use crate::audio_lib::controls::play::play;
use crate::database::sqlite::Db;
use book_managers::import_book::import_book;
use book_managers::progress::start::start;
use database::sqlite::controllers::books::current::set;
use database::sqlite::controllers::get_library::get_library;
use database::sqlite::db;
use tauri::AppHandle;
use tauri::Manager;

pub async fn initialize_database(app_handle: &AppHandle) -> Db {
    let db_conn = db::establish_connection(app_handle).await;
    Db(db_conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            // Initialize the database,
            tauri::async_runtime::block_on(async move {
                let db = initialize_database(app_handle).await;
                app_handle.manage(db);
            });

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        // .manage(db) // Injects shared DB state
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            import_book,
            get_library,
            set,
            start,
            play
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri app");
}
