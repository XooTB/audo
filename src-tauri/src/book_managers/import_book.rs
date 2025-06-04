use crate::audio_lib::chapters;
use crate::audio_lib::init;
use crate::audio_lib::metadata;
use crate::database::sqlite::entity::audiobook;
use crate::database::sqlite::entity::audiobook::Entity as AudioBook;
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

    let exists = AudioBook::find()
        .filter(audiobook::Column::Title.contains(&book_metadata.title))
        .all(conn)
        .await;

    match exists {
        Ok(e) => {
            if e.len() >= 1 {
                println!("Book already exists!");
                Ok(())
            } else {
                let stringified_chapters = serde_json::to_string(&chapters).unwrap();

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

                let _ = new_book.insert(conn).await.map_err(|e| e.to_string())?;

                println!("Book Imported successfull!");

                Ok(())
            }
        }
        Err(err) => {
            println!("Something went wrong while querying the local database! Please try again!");
            Err(err.to_string())
        }
    }
}
