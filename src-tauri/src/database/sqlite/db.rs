use crate::database::sqlite::run_migrations;
use sea_orm::{Database, DbConn};
use std::{env, path::PathBuf, sync::Arc};
use tauri::{AppHandle, Manager};

fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("app data dir not found!");
    println!("{:?}", app_dir.to_str());
    let dir = env::current_dir().expect("Failed to get the current dir!");
    dir
}

pub async fn establish_connection(app_handle: &AppHandle) -> Arc<DbConn> {
    // Get the app data directory for storing the database
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("app data dir not found!");

    // Database file path
    let db_path = app_data_dir.join("database.sqlite");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    println!("Databse URL: {db_url}");

    // Connect to the database
    let db_connection = Database::connect(&db_url)
        .await
        .map_err(|e| e.to_string())
        .expect("Something went wrong while creating the connection!");

    // Run any pending migrations.
    run_migrations::run_migrations(&db_connection)
        .await
        .expect("Something went wrong while running migratons!");

    Arc::new(db_connection)
}
