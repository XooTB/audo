use rodio::{OutputStream, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader};
use std::sync::Mutex;

// State to keep the OutputStream alive
pub struct AudioState {
    pub _stream: Option<OutputStream>,
    pub stream_handle: Option<rodio::OutputStream>,
    pub sink: Option<Sink>,
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            _stream: None,
            stream_handle: None,
            sink: None,
        }
    }
}

#[tauri::command]
pub async fn play(audio_state: tauri::State<'_, Mutex<AudioState>>) -> Result<(), String> {
    let file_path = "/home/xoot/audiobooks/01 All These Worlds.m4b";
    let file = File::open(&file_path).map_err(|e| e.to_string())?;

    let mut state = audio_state.lock().map_err(|e| e.to_string())?;

    // Initialize stream if not already created
    if state._stream.is_none() {
        let stream_handle = OutputStreamBuilder::open_default_stream()
            .map_err(|e| format!("Unable to open default stream: {:?}", e))?;
        state.stream_handle = Some(stream_handle);
    }

    // Get the stream handle
    let handle = state.stream_handle.as_ref().unwrap();
   
    // Create source from file
    let buf_reader = BufReader::new(file);
    let source = rodio::Decoder::new(buf_reader)
        .map_err(|e| format!("Unable to decode audio: {:?}", e))?;

    handle.mixer().add(source);
    
    Ok(())
}
