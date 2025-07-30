use crate::audio_lib::player::AudioPlayer;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;

pub struct AudioState {
    pub player: Option<AudioPlayer>,
    pub current_book_id: Option<i32>,
    pub current_position_seconds: f64,
    pub playback_start_time: Option<Instant>,
    pub last_pause_position: f64,
    pub current_file_path: Option<String>,
    pub target_sample_rate: u32,
    pub target_channels: u16,
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            player: None,
            current_book_id: None,
            current_position_seconds: 0.0,
            playback_start_time: None,
            last_pause_position: 0.0,
            current_file_path: None,
            target_sample_rate: 44100, // Default values
            target_channels: 2,
        }
    }

    pub fn update_position(&mut self) {
        if let Some(start_time) = self.playback_start_time {
            let elapsed = start_time.elapsed();
            self.current_position_seconds = self.last_pause_position + elapsed.as_secs_f64();
        }
    }

    pub fn start_playback(&mut self) {
        self.playback_start_time = Some(Instant::now());
    }

    pub fn pause_playback(&mut self) {
        self.update_position();
        self.last_pause_position = self.current_position_seconds;
        self.playback_start_time = None;
    }

    pub fn seek_to(&mut self, position_seconds: f64) {
        self.current_position_seconds = position_seconds;
        self.last_pause_position = position_seconds;
        if self.playback_start_time.is_some() {
            self.playback_start_time = Some(Instant::now());
        }
    }

    pub fn get_current_position(&mut self) -> f64 {
        self.update_position();
        self.current_position_seconds
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