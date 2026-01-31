use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader};

pub struct AudioPlayer {
    pub current_track: Option<OutputStream>,
    pub _stream: Option<OutputStream>,
    pub stream_handle: Option<rodio::OutputStream>,
    pub sinks: Vec<Sink>,
    pub sink: Option<Sink>,
    pub source: Option<Decoder<BufReader<File>>>,
    pub current_track_path: Option<String>,
}

impl AudioPlayer {
    pub fn new() -> Self {
        AudioPlayer {
            current_track: None,
            _stream: None,
            stream_handle: None,
            sinks: Vec::new(),
            sink: None,
            source: None,
            current_track_path: None,
        }
    }

    // Initialize the stream (call this before adding sources)
    pub fn init(&mut self) -> Result<(), String> {
        if self._stream.is_none() {
            self._stream = Some(OutputStreamBuilder::open_default_stream().unwrap());
        }
        Ok(())
    }

    fn stream_initalized(&self) -> bool {
        self._stream.is_some()
    }

    pub fn change_current_source(
        &mut self,
        file_path: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
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

        // Set the volume to 1.0
        sink.set_volume(1.0);
        sink.pause(); // Start paused

        self.sink = Some(sink);
        Ok(())
    }

    // Add a new audio source to the mixer
    pub fn add_source(&mut self, file_path: &str) -> Result<usize, Box<dyn std::error::Error>> {
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

        // Set the volume to 1.0
        sink.set_volume(1.0);
        sink.pause(); // Start paused

        let index = self.sinks.len();
        self.sinks.push(sink);
        Ok(index)
    }

    // Alternative method to add source using BufReader (for problematic files)
    pub fn add_source_with_buffer(
        &mut self,
        file_path: &str,
    ) -> Result<usize, Box<dyn std::error::Error>> {
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
        sink.set_volume(1.0);
        sink.pause(); // Start paused

        let index = self.sinks.len();
        self.sinks.push(sink);
        Ok(index)
    }

    // Remove an audio source from the mixer
    pub fn remove_source(&mut self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if index < self.sinks.len() {
            let sink = self.sinks.remove(index);
            sink.stop();
        }
        Ok(())
    }

    // Play a specific source
    pub fn play(&self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = self.sinks.get(index) {
            sink.play();
        }
        Ok(())
    }

    // Pause a specific source
    pub fn pause(&self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = self.sinks.get(index) {
            sink.pause();
        }
        Ok(())
    }
}
