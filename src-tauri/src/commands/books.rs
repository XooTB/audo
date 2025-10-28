use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
// use std::error::Error;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct Book {
    id: i32,
    name: String,
    file_location: String,
    cover_image: String,
    author: String,
    narrator: String,
    duration: i32,
    size: i32,
    created_at: String,
    updated_at: String,
}

#[tauri::command]
pub async fn get_all_books(pool: State<'_, Arc<SqlitePool>>) -> Result<Vec<Book>, String> {
    let books = sqlx::query_as::<_, Book>("SELECT * FROM audio_books")
        .fetch_all(&**pool)
        .await
        .expect("Failed to get all books");

    Ok(books)
}
