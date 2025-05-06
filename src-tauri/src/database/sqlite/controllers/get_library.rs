use crate::database::sqlite::entity::audiobook;
use crate::database::sqlite::entity::audiobook::Entity as AudioBook;
use crate::database::sqlite::Db;
use sea_orm::EntityTrait;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AudioBookResponse {
    pub id: i32,
    pub title: String,
    pub author: String,
    pub chapters: String,
    pub narrator: String,
    pub series: String,
    pub description: String,
}

impl From<audiobook::Model> for AudioBookResponse {
    fn from(book: audiobook::Model) -> Self {
        Self {
            id: book.id,
            title: book.title,
            author: book.author,
            chapters: book.chapters,
            narrator: book.narrator,
            series: book.series,
            description: book.description,
        }
    }
}

#[tauri::command]
pub async fn get_library(db: tauri::State<'_, Db>) -> Result<Vec<AudioBookResponse>, String> {
    let conn = &*db.inner().0;
    let result = AudioBook::find().all(conn).await;

    match result {
        Ok(books) => Ok(books.into_iter().map(AudioBookResponse::from).collect()),
        Err(err) => {
            println!("Something went wrong while fetching the library. {:?}", err);
            Err(err.to_string())
        }
    }
}
