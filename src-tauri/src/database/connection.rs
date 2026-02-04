use sqlx::{migrate::Migrator, sqlite::SqlitePoolOptions, SqlitePool};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

pub async fn init_db(app: &AppHandle) -> Arc<SqlitePool> {
    let app_data_dir = app.path().app_data_dir().expect("app data dir not found");

    let db_path = app_data_dir.join("database.sqlite");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    println!("DB URL: {}", db_url);

    let pool_options = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30));

    let pool = pool_options
        .connect(&db_url)
        .await
        .expect("Failed to connect to SQLite");

    // Run migrations
    MIGRATOR
        .run(&pool)
        .await
        .expect("Failed to run migrations.");

    Arc::new(pool)
}
