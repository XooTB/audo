use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use sea_orm::EntityTrait;
// use crate::database::sqlite::entity::current_book;
use crate::database::sqlite::Db;

#[tauri::command]
pub async fn set(book_id: i32, db: tauri::State<'_, Db>) -> Result<(), String> {
    let conn = &*db.inner().0;

    // Find out the book from the library.
    let book = Audiobook::find_by_id(book_id).all(conn).await;

    if book.iter().len() > 0 {
        println!("Book found!: {:?}", book)
    }

    Ok(())
}
