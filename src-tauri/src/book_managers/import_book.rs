use crate::audio_lib::chapters;
use crate::audio_lib::init;
use crate::audio_lib::metadata;

use crate::database::sqlite::entity::audiobook;
use crate::database::sqlite::Db;
use sea_orm::*;

#[tauri::command]
pub async fn import_book(file_path: &str, db: tauri::State<'_, Db>) -> Result<(), String> {
    println!("File recieved! Processing....");
    let context =
        init::init(&file_path).expect("Something went wrong while parsing the audio file.");
    let book_metadata = metadata::extract_metadata(&context);
    let chapters = chapters::get_chapters(&context);
    let conn = &*db.inner().0;

    let stringified_chapters = serde_json::to_string(&chapters).unwrap();

    let new_book = audiobook::ActiveModel {
        title: Set(book_metadata.title.to_owned()),
        author: Set(book_metadata.author.to_owned()),
        chapters: Set(stringified_chapters),
        ..Default::default()
    };

    let _book_model = new_book.insert(conn).await.map_err(|e| e.to_string())?;

    println!("Book Imported successfull!");

    Ok(())
}
