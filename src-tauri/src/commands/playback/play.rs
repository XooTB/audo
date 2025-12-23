use crate::audio_player::AudioPlayer;
use crate::db::fetch::fetch_book;
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
    let mut book = fetch_book(&pool, book_id).await?;

    // Get the audio player from the state
    let mut player = audio_player.lock().unwrap();

    book.file_location =
        "D:/Downloads/Novels/Book 5 The Butcher's Masquerade/The Butcher's Masquerade.m4b"
            .to_string();

    println!("player successfully locked");

    // Check if the book is already loaded into the player.
    if player.current_track_path.is_some()
        && player.current_track_path.as_ref().unwrap() == &book.file_location
    {
        println!("book is already loaded into the player");
        player.play().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Otherwise, load the book into the player.
    println!(
        "loading book into the player file location: {}",
        book.file_location
    );
    player
        .change_current_track(&book.file_location)
        .map_err(|e| e.to_string())?;

    // And then, play the audio.
    println!("playing the audio");
    player.play().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn pause(audio_player: tauri::State<'_, Mutex<AudioPlayer>>) -> Result<(), String> {
    let mut audio_player = audio_player.lock().unwrap();
    // Pause the audio
    audio_player.pause().map_err(|e| e.to_string())?;

    Ok(())
}
