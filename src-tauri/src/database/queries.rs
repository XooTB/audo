use crate::models::{Book, Chapter, PlaybackProgress};
use crate::utils::extract_metadata::Chapter as MetadataChapter;
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

pub async fn save_progress(
    pool: &SqlitePool,
    book_id: i32,
    position: f64,
    chapter_index: Option<i32>,
    chapter_position: Option<f64>,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO playback_progress (book_id, position, chapter_index, chapter_position, last_listened_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(book_id) DO UPDATE SET
            position = excluded.position,
            chapter_index = excluded.chapter_index,
            chapter_position = excluded.chapter_position,
            last_listened_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP",
    )
    .bind(book_id)
    .bind(position)
    .bind(chapter_index)
    .bind(chapter_position)
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

pub async fn save_chapters(
    pool: &SqlitePool,
    book_id: i32,
    chapters: &[MetadataChapter],
) -> Result<(), String> {
    if chapters.is_empty() {
        return Ok(());
    }

    for chapter in chapters {
        let start_time: f64 = chapter
            .start_time
            .parse()
            .map_err(|e| format!("Failed to parse start_time: {}", e))?;
        let end_time: f64 = chapter
            .end_time
            .parse()
            .map_err(|e| format!("Failed to parse end_time: {}", e))?;

        sqlx::query(
            "INSERT INTO chapters (book_id, chapter_index, start_time, end_time, title)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(book_id)
        .bind(chapter.id)
        .bind(start_time)
        .bind(end_time)
        .bind(&chapter.title)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to save chapter: {}", e))?;
    }

    Ok(())
}

pub async fn get_chapters_for_book(
    pool: &SqlitePool,
    book_id: i32,
) -> Result<Vec<Chapter>, String> {
    let chapters = sqlx::query_as::<_, Chapter>(
        "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_index ASC",
    )
    .bind(book_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to get chapters: {}", e))?;

    Ok(chapters)
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
