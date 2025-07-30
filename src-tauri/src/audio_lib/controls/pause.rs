use crate::audio_lib::state;

#[tauri::command]
pub async fn pause() -> Result<(), String> {
    let audio_state = state::get_audio_state();
    let mut audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        if player.is_playing() {
            player.pause();
            audio_state_guard.pause_playback();
            println!("Audio playback paused at position {:.2}s", audio_state_guard.current_position_seconds);
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
    let mut audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        if player.is_playing() {
            player.pause();
            audio_state_guard.pause_playback();
            println!("Audio playback paused");
            Ok(false) // Now paused
        } else {
            // Only play if there's audio data in buffer
            if player.buffer_size() > 0 {
                player.play();
                audio_state_guard.start_playback();
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
    let mut audio_state_guard = audio_state.lock().unwrap();
    
    let current_position = audio_state_guard.get_current_position();
    let current_book_id = audio_state_guard.current_book_id;
    
    if let Some(ref player) = audio_state_guard.player {
        let is_playing = player.is_playing();
        let buffer_size = player.buffer_size();
        let sample_rate = player.get_sample_rate();
        let channels = player.get_channels();
        
        Ok(serde_json::json!({
            "is_playing": is_playing,
            "buffer_size": buffer_size,
            "sample_rate": sample_rate,
            "channels": channels,
            "current_book_id": current_book_id,
            "current_position_seconds": current_position
        }))
    } else {
        Ok(serde_json::json!({
            "is_playing": false,
            "buffer_size": 0,
            "sample_rate": 0,
            "channels": 0,
            "current_book_id": null,
            "current_position_seconds": 0.0
        }))
    }
}

#[tauri::command]
pub async fn seek_to_position(position_seconds: f64) -> Result<(), String> {
    use crate::audio_lib::controls::play::load_audio_from_position;
    
    let audio_state = state::get_audio_state();
    let audio_state_guard = audio_state.lock().unwrap();
    
    if let Some(ref player) = audio_state_guard.player {
        // Get the file path and audio parameters
        let file_path = audio_state_guard.current_file_path.clone().ok_or("No audio file currently loaded")?;
        let sample_rate = audio_state_guard.target_sample_rate;
        let channels = audio_state_guard.target_channels;
        let was_playing = player.is_playing();
        
        drop(audio_state_guard); // Release lock before heavy operation
        
        // Load new audio data from the seek position
        match load_audio_from_position(&file_path, sample_rate, channels, position_seconds, 30) {
            Ok(samples) => {
                let mut audio_state_guard = audio_state.lock().unwrap();
                
                // Update position tracking FIRST
                audio_state_guard.seek_to(position_seconds);
                
                if let Some(ref player) = audio_state_guard.player {
                    // Clear old buffer and load new data
                    player.clear_buffer();  // This also resets buffer_position
                    player.load_audio_data(samples);
                    
                    // Restore playback state if it was playing
                    if was_playing {
                        player.play();
                        audio_state_guard.start_playback(); // Restart timing from new position
                    }
                    
                    println!("Successfully seeked to position {:.2}s", position_seconds);
                    Ok(())
                } else {
                    Err("Audio player no longer available".to_string())
                }
            }
            Err(e) => {
                println!("Failed to load audio from position {:.2}s: {}", position_seconds, e);
                Err(format!("Failed to seek: {}", e))
            }
        }
    } else {
        Err("Audio player not initialized".to_string())
    }
}

#[tauri::command]
pub async fn skip_forward(seconds: f64) -> Result<(), String> {
    let audio_state = state::get_audio_state();
    
    let new_pos = {
        let mut audio_state_guard = audio_state.lock().unwrap();
        
        if audio_state_guard.player.is_none() {
            return Err("Audio player not initialized".to_string());
        }
        
        let current_pos = audio_state_guard.get_current_position();
        current_pos + seconds
    }; // MutexGuard is dropped here
    
    // Use the proper seek function
    seek_to_position(new_pos).await?;
    println!("Skipped forward {:.2}s to position {:.2}s", seconds, new_pos);
    Ok(())
}

#[tauri::command]
pub async fn skip_backward(seconds: f64) -> Result<(), String> {
    let audio_state = state::get_audio_state();
    
    let new_pos = {
        let mut audio_state_guard = audio_state.lock().unwrap();
        
        if audio_state_guard.player.is_none() {
            return Err("Audio player not initialized".to_string());
        }
        
        let current_pos = audio_state_guard.get_current_position();
        (current_pos - seconds).max(0.0) // Don't go below 0
    }; // MutexGuard is dropped here
    
    // Use the proper seek function
    seek_to_position(new_pos).await?;
    println!("Skipped backward {:.2}s to position {:.2}s", seconds, new_pos);
    Ok(())
}