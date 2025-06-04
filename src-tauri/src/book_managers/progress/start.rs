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

    // Check if the book is already in the progress table.
    let res = Progress::find_by_id(book_id).one(conn).await;

    match res {
        Ok(Some(_book)) => {
            // If the book was found
            return Ok(());
        }
        Ok(None) => {
            // find the book from the database.
            let book = Audiobook::find_by_id(book_id).one(conn).await;

            // Match the query results
            match book {
                Ok(e) => {
                    let book = e.unwrap().to_owned();
                    let book_chapters: Vec<BookChapter> =
                        serde_json::from_str(&book.chapters).unwrap();

                    // Create the Book Object
                    let progress = progress::ActiveModel {
                        book_id: Set(book.id),
                        current_chapter: Set(book_chapters[0].id),
                        chapter_progress: Set(0),
                        book_progress: Set(0),
                        currently_reading: Set(true),
                        status: Set("reading".to_string()),
                    };

                    // Save the Book Progress.
                    let res = progress.insert(conn).await;

                    match res {
                        Ok(entity) => {
                            println!("Started Book: {:?}", entity);
                        }
                        Err(err) => {
                            println!(
                                "Something went wrong while starting the book! Error: {:?}",
                                err
                            )
                        }
                    }
                }
                Err(err) => {
                    println!("Error finding book: {:?}", err)
                }
            }
        }
        Err(_) => {}
    }

    Ok(())
}
