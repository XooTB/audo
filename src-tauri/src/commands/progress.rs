use crate::database::{get_last_listened_book, get_progress, save_progress};
use crate::models::{Book, PlaybackProgress};
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn save_playback_progress(
    pool: State<'_, Arc<SqlitePool>>,
    book_id: i32,
    position: f64,
) -> Result<(), String> {
    save_progress(&pool, book_id, position).await
}

#[tauri::command]
pub async fn get_playback_progress(
    pool: State<'_, Arc<SqlitePool>>,
    book_id: i32,
) -> Result<Option<PlaybackProgress>, String> {
    get_progress(&pool, book_id).await
}

#[tauri::command]
pub async fn get_last_listened(
    pool: State<'_, Arc<SqlitePool>>,
) -> Result<Option<(Book, PlaybackProgress)>, String> {
    get_last_listened_book(&pool).await
}
