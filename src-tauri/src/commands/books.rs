use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
// use std::error::Error;
use crate::utils::extract_metadata;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct Book {
    id: Option<i32>,
    name: String,
    file_location: String,
    cover_image: String,
    author: String,
    narrator: String,
    duration: f64,
    size: i32,
    created_at: Option<String>,
    updated_at: Option<String>,
}

#[tauri::command]
pub async fn get_all_books(pool: State<'_, Arc<SqlitePool>>) -> Result<Vec<Book>, String> {
    let books = sqlx::query_as::<_, Book>("SELECT * FROM audio_books")
        .fetch_all(&**pool)
        .await
        .expect("Failed to get all books");

    Ok(books)
}

#[tauri::command]
pub async fn add_book(
    app: tauri::AppHandle,
    pool: State<'_, Arc<SqlitePool>>,
    file_path: String,
) -> Result<(), String> {
    let metadata = extract_metadata(app, &file_path)
        .await
        .expect("Failed to extract metadata");

    let book = Book {
        id: None,
        name: metadata.title,
        file_location: file_path,
        cover_image: "".to_string(),
        author: metadata.author,
        narrator: metadata.narrator,
        duration: metadata.duration.parse::<f64>().unwrap_or(0.0),
        size: metadata.size.parse::<i32>().unwrap_or(0),
        created_at: None,
        updated_at: None,
    };

    // Check if book already exists
    let existing_book =
        sqlx::query_as::<_, Book>("SELECT * FROM audio_books WHERE file_location = ?")
            .bind(&book.file_location)
            .fetch_optional(&**pool)
            .await
            .expect("Failed to check if book already exists");

    if existing_book.is_some() {
        return Err("Book already exists".to_string());
    }

    let _result = sqlx::query("INSERT INTO audio_books (name, file_location, cover_image, author, narrator, duration, size) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(book.name)
        .bind(book.file_location)
        .bind(book.cover_image)
        .bind(book.author)
        .bind(book.narrator)
        .bind(book.duration)
        .bind(book.size)
        .execute(&**pool).await.map_err(|e| e.to_string())?;

    Ok(())
}
