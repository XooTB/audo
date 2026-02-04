use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct Book {
    pub id: Option<i32>,
    pub name: String,
    pub file_location: String,
    pub cover_image: String,
    pub author: String,
    pub narrator: String,
    pub duration: f64,
    pub size: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
