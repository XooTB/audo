use crate::audio_lib::state;

#[tauri::command]
pub async fn pause() -> Result<(), String> {
    let audio_state = state::get_audio_state();
    let audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        if player.is_playing() {
            player.pause();
            println!("Audio playback paused");
        } else {
            println!("Audio is not currently playing");
        }
    } else {
        return Err("Audio player not initialized".to_string());
    }
    
    Ok(())
}

#[tauri::command]
pub async fn toggle_play_pause() -> Result<bool, String> {
    let audio_state = state::get_audio_state();
    let audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        if player.is_playing() {
            player.pause();
            println!("Audio playback paused");
            Ok(false) // Now paused
        } else {
            // Only play if there's audio data in buffer
            if player.buffer_size() > 0 {
                player.play();
                println!("Audio playback resumed");
                Ok(true) // Now playing
            } else {
                return Err("No audio data loaded. Use play command to load and start playback.".to_string());
            }
        }
    } else {
        return Err("Audio player not initialized".to_string());
    }
}

#[tauri::command]
pub async fn get_playback_state() -> Result<serde_json::Value, String> {
    let audio_state = state::get_audio_state();
    let audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        Ok(serde_json::json!({
            "is_playing": player.is_playing(),
            "buffer_size": player.buffer_size(),
            "sample_rate": player.get_sample_rate(),
            "channels": player.get_channels(),
            "current_book_id": audio_state_guard.current_book_id
        }))
    } else {
        Ok(serde_json::json!({
            "is_playing": false,
            "buffer_size": 0,
            "sample_rate": 0,
            "channels": 0,
            "current_book_id": null
        }))
    }
}