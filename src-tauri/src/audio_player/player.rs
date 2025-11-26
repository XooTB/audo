use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader};

pub struct AudioPlayer {
    pub current_track: Option<OutputStream>,
    pub _stream: Option<OutputStream>,
    pub stream_handle: Option<rodio::OutputStream>,
    pub sink: Option<Sink>,
    pub source: Option<Decoder<BufReader<File>>>,
    pub current_track_path: Option<String>,
}

impl AudioPlayer {
    pub fn new() -> Self {
        Self {
            current_track: None,
            _stream: None,
            stream_handle: None,
            sink: None,
            source: None,
            current_track_path: None,
        }
    }

    pub fn init(&mut self) -> Result<(), String> {
        // Initialize the stream_handle
        let stream_handle = OutputStreamBuilder::open_default_stream()
            .map_err(|e| format!("Unable to open default stream: {:?}", e))?;

        // Set the default stream_handle
        self.stream_handle = Some(stream_handle);

        // Initialize the sink
        let sink = Sink::connect_new(&self.stream_handle.as_ref().unwrap().mixer());

        // Add the source to the sink
        self.sink = Some(sink);

        Ok(())
    }

    pub fn change_current_track(&mut self, file_path: &str) -> Result<(), String> {
        let file = File::open(&file_path).map_err(|e| e.to_string())?;

        // If the current track path is the same as the new file path, return
        if self.current_track_path.is_some()
            && self.current_track_path.as_ref().unwrap() == file_path
        {
            println!("Current track path is the same as the new file path, skipping...");
            return Ok(());
        }

        // Otherwise update the current track path
        self.current_track_path = Some(file_path.to_string());
        let audio_buf = BufReader::new(file);

        // Create the source from the audio buffer
        let source = Decoder::new(audio_buf)
            .map_err(|err| format!("Unable to decode the input file!: {:?}", err))?;

        // Set the source to the player
        self.source = Some(source);

        // Empty the sink
        self.sink.as_mut().unwrap().clear();

        Ok(())
    }

    pub fn create_source(
        &mut self,
        file_path: &String,
    ) -> Result<Decoder<BufReader<File>>, String> {
        let file = File::open(&file_path).map_err(|e| e.to_string())?;
        let audio_buf = BufReader::new(file);
        let source = Decoder::new(audio_buf)
            .map_err(|err| format!("Unable to decode the input file!: {:?}", err))?;

        Ok(source)
    }

    pub fn play(&mut self) -> Result<(), String> {
        // Check if the curren track is already appended to the sink
        if self.current_track_path.is_some() {
            if self.sink.as_mut().unwrap().empty() {
                // Create a new source from the current track and append it to the sink.
                let file_path = self.current_track_path.as_deref().unwrap();
                let source = self.create_source(&file_path.to_string()).unwrap();

                self.sink.as_mut().unwrap().append(source);
                self.sink.as_mut().unwrap().play();
            } else if self.sink.as_mut().unwrap().is_paused() {
                self.sink.as_mut().unwrap().play();
            }
        } else {
            println!("Current track is not set. Please set the current track first.");
        }

        Ok(())
    }

    pub fn pause(&mut self) -> Result<(), String> {
        if let Some(sink) = self.sink.as_mut() {
            sink.pause();
            println!("Sink paused!");
        } else {
            return Err("No sink found".to_string());
        }
        Ok(())
    }
}
