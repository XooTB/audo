use sea_orm::{Database, DatabaseConnection};
use std::{env, path::PathBuf};

fn get_db_path() -> PathBuf {
    let dir = env::current_dir().expect("Failed to get the current dir!");
    dir
}

pub async fn establish_connection() -> Result<DatabaseConnection, String> {
    // Get the app data directory for storing the database
    let app_data_dir = get_db_path();

    // Database file path
    let db_path = app_data_dir.join("database.sqlite");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    println!("Databse URL: {db_url}");

    // Connect to the database
    let connection = Database::connect(&db_url)
        .await
        .map_err(|e| e.to_string())?;

    Ok(connection)
}
