use crate::audio_player::AudioPlayer;
use crate::database::{get_chapters_for_book, save_chapters};
use crate::models::{Book, Chapter};
use crate::utils::extract_metadata;
use sqlx::SqlitePool;
use std::sync::{Arc, Mutex};
use tauri::State;

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
        content_id: metadata.content_id,
        identity_method: metadata.identity_method,
        asin: metadata.asin,
        isbn: metadata.isbn,
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

    let result = sqlx::query("INSERT INTO audio_books (name, file_location, cover_image, author, narrator, duration, size, content_id, identity_method, asin, isbn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(book.name)
        .bind(book.file_location)
        .bind(book.cover_image)
        .bind(book.author)
        .bind(book.narrator)
        .bind(book.duration)
        .bind(book.size)
        .bind(book.content_id)
        .bind(book.identity_method)
        .bind(book.asin)
        .bind(book.isbn)
        .execute(&**pool).await.map_err(|e| e.to_string())?;

    let book_id = result.last_insert_rowid() as i32;
    save_chapters(&pool, book_id, &metadata.chapters).await?;

    Ok(())
}

#[tauri::command]
pub async fn remove_book(
    audio_player: tauri::State<'_, Mutex<AudioPlayer>>,
    pool: State<'_, Arc<SqlitePool>>,
    book_id: i32,
) -> Result<(), String> {
    // If this book is currently loaded in the player, stop playback
    {
        let mut player = audio_player.lock().unwrap();
        if player.get_current_track_id() == Some(book_id) {
            player.remove_source().map_err(|e| e.to_string())?;
            player.current_track_id = None;
            player.current_track_path = None;
        }
    }

    sqlx::query("DELETE FROM audio_books WHERE id = ?")
        .bind(book_id)
        .execute(&**pool)
        .await
        .map_err(|e| format!("Failed to remove book: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_chapters(
    pool: State<'_, Arc<SqlitePool>>,
    book_id: i32,
) -> Result<Vec<Chapter>, String> {
    get_chapters_for_book(&**pool, book_id).await
}
