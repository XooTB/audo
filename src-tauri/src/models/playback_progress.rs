use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct PlaybackProgress {
    pub id: Option<i32>,
    pub book_id: i32,
    pub position: f64,
    pub completed: bool,
    pub last_listened_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub chapter_index: Option<i32>,
    pub chapter_position: Option<f64>,
}
