use crate::database::sqlite::entity::audiobook;
use crate::database::sqlite::entity::audiobook::Entity as AudioBook;
use crate::database::sqlite::entity::progress;
use crate::database::sqlite::Db;
use sea_orm::RelationTrait;
use sea_orm::{EntityTrait, FromQueryResult, JoinType, QuerySelect};
use serde::{Deserialize, Serialize};

// AudioBook Response struct
#[derive(Serialize, Deserialize, Debug, FromQueryResult)]
pub struct AudioBookResponse {
    pub id: i32,
    pub title: String,
    pub author: String,
    pub narrator: String,
    pub series: String,
    pub description: String,
    pub status: Option<String>,
}

// get_library function
#[tauri::command]
pub async fn get_library(db: tauri::State<'_, Db>) -> Result<Vec<AudioBookResponse>, String> {
    let conn = &*db.inner().0;
    
    println!("Fetching library from database...");
    
    let result: Result<Vec<AudioBookResponse>, sea_orm::DbErr> = AudioBook::find()
        .select_only()
        .columns([
            audiobook::Column::Id,
            audiobook::Column::Title,
            audiobook::Column::Series,  
            audiobook::Column::Author,
            audiobook::Column::Narrator,
            audiobook::Column::Description,
        ])
        .column_as(progress::Column::Status, "status")
        .join(JoinType::LeftJoin, audiobook::Relation::Progress.def())
        .into_model::<AudioBookResponse>()
        .all(conn)
        .await;

    match result {
        Ok(books) => {
            println!("Successfully fetched {} books from library", books.len());
            
            // Validate that each book has required fields
            let validated_books: Vec<AudioBookResponse> = books.into_iter()
                .filter_map(|book| {
                    // Ensure minimum required fields are present
                    if book.title.trim().is_empty() {
                        println!("Warning: Skipping book with empty title (ID: {})", book.id);
                        None
                    } else {
                        Some(AudioBookResponse {
                            id: book.id,
                            title: book.title.trim().to_string(),
                            author: if book.author.trim().is_empty() { "Unknown".to_string() } else { book.author.trim().to_string() },
                            narrator: if book.narrator.trim().is_empty() { "Unknown".to_string() } else { book.narrator.trim().to_string() },
                            series: book.series.trim().to_string(),
                            description: book.description.trim().to_string(),
                            status: book.status.or(Some("new".to_string())),
                        })
                    }
                })
                .collect();
                
            Ok(validated_books)
        }
        Err(err) => {
            println!("Database error while fetching library: {:?}", err);
            Err(format!("Failed to fetch library from database: {}", err))
        }
    }
}
