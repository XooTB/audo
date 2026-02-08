use crate::audio_player::AudioPlayer;
use crate::database::fetch_book;
use sqlx::SqlitePool;
use std::sync::{Arc, Mutex};
use tauri::State;

#[tauri::command]
pub async fn play(
    audio_player: tauri::State<'_, Mutex<AudioPlayer>>,
    pool: State<'_, Arc<SqlitePool>>,
    book_id: i32,
) -> Result<(), String> {
    println!("playing book with id: {}", book_id);

    // Fetch the book from the database.
    let book = fetch_book(&pool, book_id).await?;

    // Get the audio player from the state
    let mut player = audio_player.lock().unwrap();

    // Check if the book is already loaded into the player.
    if player.current_track_path.is_some()
        && player.current_track_path.as_ref().unwrap() == &book.file_location
    {
        println!("book is already loaded into the player! Playing it...");
        player.play().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Otherwise, load the book into the player.
    player
        .change_current_source(&book.file_location, book.id.unwrap().clone())
        .map_err(|e| e.to_string())?;

    // And then, play the audio.
    player.play().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn pause(audio_player: tauri::State<'_, Mutex<AudioPlayer>>) -> Result<(), String> {
    let audio_player = audio_player.lock().unwrap();
    // Pause the audio
    audio_player.pause().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_current_timestamp(
    audio_player: tauri::State<'_, Mutex<AudioPlayer>>,
) -> Result<u64, String> {
    let audio_player = audio_player.lock().unwrap();
    let current_timestamp = audio_player
        .get_current_timestamp()
        .map_err(|e| e.to_string())?;

    println!("Current timestamp: {}", current_timestamp);

    Ok(current_timestamp)
}

#[tauri::command]
pub async fn seek(
    audio_player: tauri::State<'_, Mutex<AudioPlayer>>,
    position: f64,
) -> Result<(), String> {
    let player = audio_player.lock().unwrap();
    player.seek(position).map_err(|e| e.to_string())?;
    Ok(())
}
