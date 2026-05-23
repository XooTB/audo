use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::State;

use crate::{database::{get_default_config, get_config, save_config}, utils::{ConfigEntry, ConfigKey}};

#[tauri::command]
pub async fn get_default_state(
    pool: State<'_, Arc<SqlitePool>>,
) -> Result<Vec<ConfigEntry>, String> {
    get_default_config(&pool).await
}

#[tauri::command]
pub async fn get_frontend_mode(
    pool: State<'_, Arc<SqlitePool>>,
) -> Result<String, String> {
    get_config(&pool, ConfigKey::FrontendMode).await
}

#[tauri::command]
pub async fn save_frontend_mode(
    pool: State<'_, Arc<SqlitePool>>,
    mode: String,
) -> Result<(), String> {
    save_config(&pool, ConfigKey::FrontendMode, &mode).await
}
