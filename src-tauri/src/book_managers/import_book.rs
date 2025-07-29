use crate::audio_lib::chapters;
use crate::audio_lib::init;
use crate::audio_lib::metadata;
use crate::database::sqlite::entity::audiobook;
use crate::database::sqlite::entity::audiobook::Entity as AudioBook;
use crate::database::sqlite::Db;
use sea_orm::*;

#[tauri::command]
pub async fn import_book(file_path: &str, db: tauri::State<'_, Db>) -> Result<(), String> {
    println!("File received! Processing....");
    
    // Validate file path
    if file_path.is_empty() {
        return Err("File path cannot be empty".to_string());
    }
    
    // Check if file exists
    if !std::path::Path::new(file_path).exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    // Initialize and parse audio file with proper error handling
    let context = match init::init(&file_path) {
        Ok(ctx) => ctx,
        Err(e) => {
            return Err(format!("Failed to parse audio file: {}", e));
        }
    };
    
    let book_metadata = metadata::extract_metadata(&context);
    let chapters = chapters::get_chapters(&context);
    let conn = &*db.inner().0;

    // Check if book already exists
    let exists = AudioBook::find()
        .filter(audiobook::Column::Title.contains(&book_metadata.title))
        .all(conn)
        .await;

    match exists {
        Ok(existing_books) => {
            if !existing_books.is_empty() {
                println!("Book already exists: {}", book_metadata.title);
                return Err(format!("Book '{}' already exists in the library", book_metadata.title));
            }
            
            // Serialize chapters with proper error handling
            let stringified_chapters = match serde_json::to_string(&chapters) {
                Ok(json) => json,
                Err(e) => {
                    return Err(format!("Failed to serialize chapters: {}", e));
                }
            };

            let new_book = audiobook::ActiveModel {
                title: Set(book_metadata.title.to_owned()),
                author: Set(book_metadata.author.to_owned()),
                chapters: Set(stringified_chapters),
                narrator: Set(book_metadata.narrator.to_owned()),
                series: Set(book_metadata.series.to_owned()),
                description: Set(book_metadata.description.to_owned()),
                location: Set(file_path.to_owned()),
                ..Default::default()
            };

            // Insert book with proper error handling
            match new_book.insert(conn).await {
                Ok(_) => {
                    println!("Book imported successfully: {}", book_metadata.title);
                    Ok(())
                }
                Err(e) => {
                    Err(format!("Failed to save book to database: {}", e))
                }
            }
        }
        Err(err) => {
            println!("Database query failed: {:?}", err);
            Err(format!("Database error while checking for existing book: {}", err))
        }
    }
}
