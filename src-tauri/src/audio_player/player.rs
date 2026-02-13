use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader, time::Duration};

pub struct AudioPlayer {
    pub current_track_id: Option<i32>,
    pub _stream: Option<OutputStream>,
    pub stream_handle: Option<rodio::OutputStream>,
    pub sink: Option<Sink>,
    pub source: Option<Decoder<BufReader<File>>>,
    pub current_track_path: Option<String>,
    pub volume: f32,
}

impl AudioPlayer {
    pub fn new() -> Self {
        AudioPlayer {
            current_track_id: None,
            _stream: None,
            stream_handle: None,
            sink: None,
            source: None,
            current_track_path: None,
            volume: 0.5,
        }
    }

    pub fn get_current_track_id(&self) -> Option<i32> {
        self.current_track_id
    }

    pub fn set_current_track_id(&mut self, track_id: i32) {
        self.current_track_id = Some(track_id);
    }

    fn stream_initalized(&self) -> bool {
        self._stream.is_some()
    }

    // Initialize the stream (call this before adding sources)
    pub fn init(&mut self) -> Result<(), String> {
        if self._stream.is_none() {
            self._stream = Some(OutputStreamBuilder::open_default_stream().unwrap());
        }
        Ok(())
    }

    pub fn change_current_source(
        &mut self,
        file_path: &str,
        track_id: i32,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Initalize the stream if it's not initalized
        if !self.stream_initalized() {
            self.init()?;
        }

        // Get the stream reference
        let stream = self._stream.as_ref().unwrap();

        // Open the file
        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;

        // Decode the file
        let source = Decoder::try_from(file)
            .map_err(|e| format!("Failed to decode audio file '{}': {}. This might be due to unsupported format, corrupted file, or missing codec support.", file_path, e))?;

        // Connect the source to the stream
        let sink = Sink::connect_new(&stream.mixer());
        sink.append(source);

        println!("New sink added! Playing it...");

        sink.set_volume(self.volume);
        sink.play();

        // Set the states
        self.sink = Some(sink);
        self.current_track_id = Some(track_id);
        self.current_track_path = Some(file_path.to_string());

        Ok(())
    }

    // Add a new audio source to the mixer
    pub fn add_source(&mut self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Ensure stream is initialized
        if self._stream.is_none() {
            self.init()?;
        }

        // Get the stream reference
        let stream = self._stream.as_ref().unwrap();

        // Open the file
        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;

        // Decode the file
        let source = Decoder::try_from(file)
            .map_err(|e| format!("Failed to decode audio file '{}': {}. This might be due to unsupported format, corrupted file, or missing codec support.", file_path, e))?;

        // Connect the source to the stream
        let sink = Sink::connect_new(&stream.mixer());
        sink.append(source);

        sink.set_volume(self.volume);
        sink.pause(); // Start paused

        self.sink = Some(sink);

        Ok(())
    }

    // Alternative method to add source using BufReader (for problematic files)
    pub fn add_source_with_buffer(
        &mut self,
        file_path: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Ensure stream is initialized
        if self._stream.is_none() {
            self.init()?;
        }

        // Get the stream reference
        let stream = self._stream.as_ref().unwrap();

        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;

        let buffered_reader = BufReader::new(file);
        let source = Decoder::try_from(buffered_reader)
            .map_err(|e| format!("Failed to decode audio file '{}' with buffer: {}. This might be due to unsupported format, corrupted file, or missing codec support.", file_path, e))?;

        let sink = Sink::connect_new(&stream.mixer());
        sink.append(source);
        sink.set_volume(self.volume);
        sink.pause(); // Start paused

        self.sink = Some(sink);
        Ok(())
    }

    // Remove an audio source from the mixer
    pub fn remove_source(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = &mut self.sink {
            sink.stop();
            self.sink = None;
        }
        Ok(())
    }

    // Play a specific source
    pub fn play(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = &self.sink {
            sink.play();
        }
        Ok(())
    }

    // Pause a specific source
    pub fn pause(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = &self.sink {
            sink.pause();
        }
        Ok(())
    }

    pub fn get_current_timestamp(&self) -> Result<u64, Box<dyn std::error::Error>> {
        if let Some(sink) = &self.sink {
            let current_timestamp = sink.get_pos();
            return Ok(current_timestamp.as_secs());
        }
        Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::Other,
            "No sink found",
        )))
    }

    pub fn get_current_timestamp_f64(&self) -> Result<f64, Box<dyn std::error::Error>> {
        if let Some(sink) = &self.sink {
            let current_timestamp = sink.get_pos();
            return Ok(current_timestamp.as_secs_f64());
        }
        Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::Other,
            "No sink found",
        )))
    }

    pub fn seek(&self, position_secs: f64) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = &self.sink {
            sink.try_seek(Duration::from_secs_f64(position_secs))?;
            return Ok(());
        }
        Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::Other,
            "No sink found",
        )))
    }

    pub fn set_volume(&mut self, volume: f32) {
        self.volume = volume;
        if let Some(sink) = &self.sink {
            sink.set_volume(volume);
        }
    }
}
