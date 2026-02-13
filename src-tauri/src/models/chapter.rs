use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct Chapter {
    pub id: Option<i32>,
    pub book_id: i32,
    pub chapter_index: i32,
    pub start_time: f64,
    pub end_time: f64,
    pub title: Option<String>,
}
