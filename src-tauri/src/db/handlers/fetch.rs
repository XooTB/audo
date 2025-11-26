use crate::structs::Book;
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
