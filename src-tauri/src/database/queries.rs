use crate::models::{Book, PlaybackProgress};
use sqlx::SqlitePool;

pub async fn fetch_book(pool: &SqlitePool, book_id: i32) -> Result<Book, String> {
    // Fetch the book from the database
    let book = sqlx::query_as::<_, Book>("SELECT * FROM audio_books WHERE id = ?")
        .bind(book_id)
        .fetch_optional(pool)
        .await
        .expect("Failed to fetch book");

    if book.is_none() {
        return Err("Book not found".to_string());
    }

    Ok(book.unwrap())
}

pub async fn save_progress(pool: &SqlitePool, book_id: i32, position: f64) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO playback_progress (book_id, position, last_listened_at, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(book_id) DO UPDATE SET
            position = excluded.position,
            last_listened_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP",
    )
    .bind(book_id)
    .bind(position)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to save progress: {}", e))?;

    Ok(())
}

pub async fn get_progress(pool: &SqlitePool, book_id: i32) -> Result<Option<PlaybackProgress>, String> {
    let progress = sqlx::query_as::<_, PlaybackProgress>(
        "SELECT * FROM playback_progress WHERE book_id = ?",
    )
    .bind(book_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get progress: {}", e))?;

    Ok(progress)
}

pub async fn fetch_book_by_content_id(
    pool: &SqlitePool,
    content_id: &str,
) -> Result<Option<Book>, String> {
    let book = sqlx::query_as::<_, Book>("SELECT * FROM audio_books WHERE content_id = ?")
        .bind(content_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to fetch book by content_id: {}", e))?;

    Ok(book)
}

pub async fn get_last_listened_book(pool: &SqlitePool) -> Result<Option<(Book, PlaybackProgress)>, String> {
    let progress = sqlx::query_as::<_, PlaybackProgress>(
        "SELECT * FROM playback_progress ORDER BY last_listened_at DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get last listened: {}", e))?;

    match progress {
        Some(p) => {
            let book = fetch_book(pool, p.book_id).await?;
            Ok(Some((book, p)))
        }
        None => Ok(None),
    }
}
