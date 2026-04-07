use crate::models::{Book, Chapter, PlaybackProgress};
use crate::utils::extract_metadata::Chapter as MetadataChapter;
use crate::utils::{ConfigEntry, ConfigKey};
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

pub async fn get_progress(
    pool: &SqlitePool,
    book_id: i32,
) -> Result<Option<PlaybackProgress>, String> {
    let progress =
        sqlx::query_as::<_, PlaybackProgress>("SELECT * FROM playback_progress WHERE book_id = ?")
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

pub async fn get_last_listened_book(
    pool: &SqlitePool,
) -> Result<Option<(Book, PlaybackProgress)>, String> {
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

pub async fn get_config(pool: &SqlitePool, key: ConfigKey) -> Result<String, String> {
    let config =
        sqlx::query_as::<_, ConfigEntry>("SELECT key, value from system_config where key = ?")
            .bind(key)
            .fetch_one(pool)
            .await
            .map_err(|e| format!("Failed to get config: {}", e))?;

    Ok(config.value)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::extract_metadata::Chapter as MetadataChapter;
    use sqlx::SqlitePool;

    /// Helper: insert a test book and return its ID.
    async fn insert_test_book(pool: &SqlitePool, name: &str) -> i32 {
        let result = sqlx::query(
            "INSERT INTO audio_books (name, file_location, cover_image, author, narrator, duration, size)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(name)
        .bind(format!("/tmp/{}.m4b", name.to_lowercase().replace(' ', "_")))
        .bind("")
        .bind("Test Author")
        .bind("Test Narrator")
        .bind(3600.0)
        .bind(100000)
        .execute(pool)
        .await
        .unwrap();

        result.last_insert_rowid() as i32
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_fetch_book_found(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Test Book").await;

        let book = fetch_book(&pool, book_id).await.unwrap();
        assert_eq!(book.name, "Test Book");
        assert_eq!(book.author, "Test Author");
        assert_eq!(book.narrator, "Test Narrator");
        assert_eq!(book.duration, 3600.0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_fetch_book_not_found(pool: SqlitePool) {
        let result = fetch_book(&pool, 9999).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Book not found");
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_save_and_get_progress(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Progress Book").await;

        save_progress(&pool, book_id, 120.5, Some(2), Some(30.5))
            .await
            .unwrap();

        let progress = get_progress(&pool, book_id).await.unwrap().unwrap();
        assert_eq!(progress.book_id, book_id);
        assert_eq!(progress.position, 120.5);
        assert_eq!(progress.chapter_index, Some(2));
        assert_eq!(progress.chapter_position, Some(30.5));
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_save_progress_upsert(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Upsert Book").await;

        save_progress(&pool, book_id, 100.0, None, None)
            .await
            .unwrap();
        save_progress(&pool, book_id, 200.0, Some(1), Some(50.0))
            .await
            .unwrap();

        let progress = get_progress(&pool, book_id).await.unwrap().unwrap();
        assert_eq!(progress.position, 200.0);
        assert_eq!(progress.chapter_index, Some(1));
        assert_eq!(progress.chapter_position, Some(50.0));

        // Verify only one row exists (upsert, not duplicate)
        let count: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM playback_progress WHERE book_id = ?")
                .bind(book_id)
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(count.0, 1);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_progress_returns_none_when_empty(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "No Progress Book").await;

        let progress = get_progress(&pool, book_id).await.unwrap();
        assert!(progress.is_none());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_fetch_book_by_content_id_found(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Content ID Book").await;
        sqlx::query("UPDATE audio_books SET content_id = ? WHERE id = ?")
            .bind("abc123hash")
            .bind(book_id)
            .execute(&pool)
            .await
            .unwrap();

        let book = fetch_book_by_content_id(&pool, "abc123hash")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(book.name, "Content ID Book");
        assert_eq!(book.content_id.as_deref(), Some("abc123hash"));
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_fetch_book_by_content_id_not_found(pool: SqlitePool) {
        let result = fetch_book_by_content_id(&pool, "nonexistent")
            .await
            .unwrap();
        assert!(result.is_none());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_save_and_get_chapters(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Chapter Book").await;

        let chapters = vec![
            MetadataChapter {
                id: 0,
                start_time: "0.0".to_string(),
                end_time: "600.0".to_string(),
                title: Some("Prologue".to_string()),
            },
            MetadataChapter {
                id: 1,
                start_time: "600.0".to_string(),
                end_time: "1200.0".to_string(),
                title: Some("Chapter 1".to_string()),
            },
            MetadataChapter {
                id: 2,
                start_time: "1200.0".to_string(),
                end_time: "1800.0".to_string(),
                title: None,
            },
        ];

        save_chapters(&pool, book_id, &chapters).await.unwrap();

        let fetched = get_chapters_for_book(&pool, book_id).await.unwrap();
        assert_eq!(fetched.len(), 3);

        // Verify ordering by chapter_index
        assert_eq!(fetched[0].chapter_index, 0);
        assert_eq!(fetched[0].start_time, 0.0);
        assert_eq!(fetched[0].end_time, 600.0);
        assert_eq!(fetched[0].title.as_deref(), Some("Prologue"));

        assert_eq!(fetched[1].chapter_index, 1);
        assert_eq!(fetched[1].title.as_deref(), Some("Chapter 1"));

        assert_eq!(fetched[2].chapter_index, 2);
        assert!(fetched[2].title.is_none());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_chapters_empty(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "No Chapters Book").await;

        let fetched = get_chapters_for_book(&pool, book_id).await.unwrap();
        assert!(fetched.is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_save_empty_chapters(pool: SqlitePool) {
        let book_id = insert_test_book(&pool, "Empty Chapters Book").await;

        save_chapters(&pool, book_id, &[]).await.unwrap();

        let fetched = get_chapters_for_book(&pool, book_id).await.unwrap();
        assert!(fetched.is_empty());
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_last_listened_book(pool: SqlitePool) {
        let book1_id = insert_test_book(&pool, "Old Book").await;
        let book2_id = insert_test_book(&pool, "Recent Book").await;

        // Insert with explicit timestamps to guarantee ordering
        sqlx::query(
            "INSERT INTO playback_progress (book_id, position, last_listened_at, updated_at)
             VALUES (?, ?, '2024-01-01 00:00:00', '2024-01-01 00:00:00')",
        )
        .bind(book1_id)
        .bind(100.0)
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO playback_progress (book_id, position, last_listened_at, updated_at)
             VALUES (?, ?, '2024-01-02 00:00:00', '2024-01-02 00:00:00')",
        )
        .bind(book2_id)
        .bind(50.0)
        .execute(&pool)
        .await
        .unwrap();

        let result = get_last_listened_book(&pool).await.unwrap().unwrap();
        let (book, progress) = result;
        assert_eq!(book.name, "Recent Book");
        assert_eq!(progress.position, 50.0);
    }

    #[sqlx::test(migrations = "./migrations")]
    async fn test_get_last_listened_book_none_when_empty(pool: SqlitePool) {
        let result = get_last_listened_book(&pool).await.unwrap();
        assert!(result.is_none());
    }
}
