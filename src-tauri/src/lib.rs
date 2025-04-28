// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

pub mod audio_lib;
pub mod database;
use database::sqlite::db;
use database::sqlite::run_migrations;

#[tauri::command]
fn tests() {
    todo!();
}

#[tauri::command]
async fn initialize_database() -> Result<(), String> {
    // Get Database Connection
    let connection = db::establish_connection()
        .await
        .expect("Something went wrong while connecting to the database!");

    run_migrations::run_migrations(&connection)
        .await
        .expect("something went wrong while running migrations!");

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![tests])
        .setup(|_| {
            tauri::async_runtime::spawn(async move {
                if let Err(e) = initialize_database().await {
                    eprintln!("Database Initalization failed: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
