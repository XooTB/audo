use crate::

#[tauri::command]
pub async fn get_default_state(
    pool: State<'_, Arc<SqlitePool>>,
) -> Result<(), String> {
    save_progress(&pool, book_id, position, chapter_index, chapter_position).await
}

