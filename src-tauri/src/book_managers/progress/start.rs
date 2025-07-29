use crate::audio_lib::chapters::BookChapter;
use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use crate::database::sqlite::entity::progress;
use crate::database::sqlite::entity::progress::Entity as Progress;
use crate::database::sqlite::Db;
use sea_orm::ActiveModelTrait;
use sea_orm::EntityTrait;
use sea_orm::Set;

#[tauri::command]
pub async fn start(book_id: i32, db: tauri::State<'_, Db>) -> Result<(), String> {
    let conn = &*db.inner().0;
    
    println!("Starting book with ID: {}", book_id);
    
    // Validate book_id
    if book_id <= 0 {
        return Err("Invalid book ID: must be a positive integer".to_string());
    }

    // Check if the book is already in the progress table
    let existing_progress = Progress::find_by_id(book_id).one(conn).await;

    match existing_progress {
        Ok(Some(existing)) => {
            println!("Book already started, current status: {}", existing.status);
            
            // Update the currently_reading flag if it's not already set
            if !existing.currently_reading {
                let mut active_progress: progress::ActiveModel = existing.into();
                active_progress.currently_reading = Set(true);
                
                match active_progress.update(conn).await {
                    Ok(_) => {
                        println!("Updated book to currently reading status");
                        Ok(())
                    }
                    Err(e) => {
                        Err(format!("Failed to update book reading status: {}", e))
                    }
                }
            } else {
                Ok(())
            }
        }
        Ok(None) => {
            // Book not started yet, find the book from the database
            let book_result = Audiobook::find_by_id(book_id).one(conn).await;

            match book_result {
                Ok(Some(book)) => {
                    println!("Found book: {} by {}", book.title, book.author);
                    
                    // Parse chapters with proper error handling
                    let book_chapters: Vec<BookChapter> = match serde_json::from_str(&book.chapters) {
                        Ok(chapters) => chapters,
                        Err(e) => {
                            return Err(format!("Failed to parse book chapters: {}", e));
                        }
                    };
                    
                    // Validate that book has chapters
                    if book_chapters.is_empty() {
                        return Err("Book has no chapters available".to_string());
                    }

                    // Create the progress record
                    let progress = progress::ActiveModel {
                        book_id: Set(book.id),
                        current_chapter: Set(book_chapters[0].id),
                        chapter_progress: Set(0),
                        book_progress: Set(0),
                        currently_reading: Set(true),
                        status: Set("reading".to_string()),
                    };

                    // Save the book progress with proper error handling
                    match progress.insert(conn).await {
                        Ok(entity) => {
                            println!("Successfully started book: '{}' (ID: {})", book.title, entity.book_id);
                            Ok(())
                        }
                        Err(err) => {
                            let error_msg = format!("Failed to save book progress to database: {}", err);
                            println!("Database error: {:?}", err);
                            Err(error_msg)
                        }
                    }
                }
                Ok(None) => {
                    let error_msg = format!("Book with ID {} not found in library", book_id);
                    println!("Error: {}", error_msg);
                    Err(error_msg)
                }
                Err(err) => {
                    let error_msg = format!("Database error while finding book: {}", err);
                    println!("Database error: {:?}", err);
                    Err(error_msg)
                }
            }
        }
        Err(err) => {
            let error_msg = format!("Database error while checking book progress: {}", err);
            println!("Database error: {:?}", err);
            Err(error_msg)
        }
    }
}
