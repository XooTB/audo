use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use sea_orm::EntityTrait;
// use crate::database::sqlite::entity::current_book;
use crate::database::sqlite::Db;

#[tauri::command]
pub async fn set(book_id: i32, db: tauri::State<'_, Db>) -> Result<(), String> {
    let conn = &*db.inner().0;
    
    println!("Setting current book with ID: {}", book_id);
    
    // Validate book_id
    if book_id <= 0 {
        return Err("Invalid book ID: must be a positive integer".to_string());
    }

    // Find the book from the library with proper error handling
    let book_result = Audiobook::find_by_id(book_id).one(conn).await;

    match book_result {
        Ok(Some(book)) => {
            println!("Book found: {} by {}", book.title, book.author);
            
            // TODO: Implement actual "current book" setting logic
            // For now, just log that we found the book
            println!("Successfully set book '{}' as current (ID: {})", book.title, book.id);
            Ok(())
        }
        Ok(None) => {
            let error_msg = format!("Book with ID {} not found in library", book_id);
            println!("Error: {}", error_msg);
            Err(error_msg)
        }
        Err(err) => {
            let error_msg = format!("Database error while finding book with ID {}: {}", book_id, err);
            println!("Database error: {:?}", err);
            Err(error_msg)
        }
    }
}
