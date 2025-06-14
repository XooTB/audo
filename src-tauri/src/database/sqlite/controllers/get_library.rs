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

    println!("{:?}", result);

    match result {
        Ok(books) => Ok(books.into_iter().map(AudioBookResponse::from).collect()),
        Err(err) => {
            println!("Something went wrong while fetching the library. {:?}", err);
            Err(err.to_string())
        }
    }
}
