use std::sync::Mutex;
use crate::commands::playback::AudioPlayer;

#[tauri::command]
pub async fn play(audio_player: tauri::State<'_, Mutex<AudioPlayer>>, file_path: String) -> Result<(), String> {
    let mut audio_player = audio_player.lock().unwrap();
    // If the existing source is not set, update it to the new audio file
    if audio_player.source.is_none() {
        audio_player.update_source(&file_path).map_err(|e| e.to_string())?;
    }

    // Otherwise, just play the audio
    audio_player.play().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn pause(audio_player: tauri::State<'_, Mutex<AudioPlayer>>) -> Result<(), String> {
    let mut audio_player = audio_player.lock().unwrap();
    // Pause the audio
    audio_player.pause().map_err(|e| e.to_string())?;

    Ok(())
}
