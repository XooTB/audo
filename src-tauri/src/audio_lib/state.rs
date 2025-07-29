use crate::audio_lib::player::AudioPlayer;
use std::sync::{Arc, Mutex, OnceLock};

pub struct AudioState {
    pub player: Option<AudioPlayer>,
    pub current_book_id: Option<i32>,
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            player: None,
            current_book_id: None,
        }
    }
}

static AUDIO_STATE: OnceLock<Arc<Mutex<AudioState>>> = OnceLock::new();

pub fn get_audio_state() -> &'static Arc<Mutex<AudioState>> {
    AUDIO_STATE.get_or_init(|| Arc::new(Mutex::new(AudioState::new())))
}

pub fn initialize_player() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let state = get_audio_state();
    let mut audio_state = state.lock().unwrap();
    
    if audio_state.player.is_none() {
        audio_state.player = Some(AudioPlayer::new()?);
        println!("Audio player initialized");
    }
    
    Ok(())
}