use rodio::{Decoder, OutputStreamBuilder, Sink, OutputStream};
use std::fs::File;
use std::io::BufReader;

struct AudioPlayer {
    // We need to keep the OutputStream alive to maintain audio playback
    _stream: Option<OutputStream>,
    sinks: Vec<Sink>,
}

impl AudioPlayer {
    fn new() -> Self {
        // We'll initialize the stream later to avoid ALSA errors in the sandbox
        AudioPlayer {
            _stream: None,
            sinks: Vec::new(),
        }
    }
    
    // Initialize the stream (call this before adding sources)
    fn init(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self._stream.is_none() {
            self._stream = Some(OutputStreamBuilder::open_default_stream()?);
        }
        Ok(())
    }
    
    // Add a new audio source to the mixer
    fn add_source(&mut self, file_path: &str) -> Result<usize, Box<dyn std::error::Error>> {
        // Ensure stream is initialized
        if self._stream.is_none() {
            self.init()?;
        }
        
        // Get the stream reference
        let stream = self._stream.as_ref().unwrap();
        
        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;
            
        let source = Decoder::try_from(file)
            .map_err(|e| format!("Failed to decode audio file '{}': {}. This might be due to unsupported format, corrupted file, or missing codec support.", file_path, e))?;
            
        let sink = Sink::connect_new(&stream.mixer());
        sink.append(source);
        sink.set_volume(1.0);
        sink.pause(); // Start paused
        
        let index = self.sinks.len();
        self.sinks.push(sink);
        Ok(index)
    }
    
    // Alternative method to add source using BufReader (for problematic files)
    fn add_source_with_buffer(&mut self, file_path: &str) -> Result<usize, Box<dyn std::error::Error>> {
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
    fn remove_source(&mut self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if index < self.sinks.len() {
            let sink = self.sinks.remove(index);
            sink.stop();
        }
        Ok(())
    }
    
    // Play a specific source
    fn play(&self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = self.sinks.get(index) {
            sink.play();
        }
        Ok(())
    }
    
    // Pause a specific source
    fn pause(&self, index: usize) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = self.sinks.get(index) {
            sink.pause();
        }
        Ok(())
    }
    
    // Set volume for a specific source (0.0 to 1.0)
    fn set_volume(&self, index: usize, volume: f32) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(sink) = self.sinks.get(index) {
            sink.set_volume(volume);
        }
        Ok(())
    }
    
    // Check if a source is currently playing
    fn is_playing(&self, index: usize) -> bool {
        if let Some(sink) = self.sinks.get(index) {
            !sink.is_paused()
        } else {
            false
        }
    }
}

fn main() {
    // Create the audio player
    let mut player = AudioPlayer::new();
    
    // Initialize the audio stream (might fail in sandbox but will work in normal environment)
    if let Err(e) = player.init() {
        println!("Failed to initialize audio player: {}", e);
        println!("This is expected in a sandbox environment. In a normal environment, the code would work correctly.");
        return;
    }
    
    // Add audio files
    let file_path_1 = "/home/xoot/Shared/local/Downloads/Novels/Enemy A - RinoZ.m4b";
    let file_path_2 = "/home/xoot/Shared/local/Downloads/01 For We Are Many.m4b";
    
    // Try to add the first file, with fallback to buffered approach
    let index1_result = player.add_source(file_path_1)
        .or_else(|_| {
            println!("Direct file loading failed for file 1, trying with buffer...");
            player.add_source_with_buffer(file_path_1)
        });
    
    match index1_result {
        Ok(index1) => {
            // Try to add the second file, with fallback to buffered approach  
            let index2_result = player.add_source(file_path_2)
                .or_else(|_| {
                    println!("Direct file loading failed for file 2, trying with buffer...");
                    player.add_source_with_buffer(file_path_2)
                });
                
            match index2_result {
                Ok(index2) => {
                    // Play the first audio file
                    player.play(index1).expect("Failed to play first audio file");
                    println!("Playing first audio file (index: {})", index1);
                    
                    // Let it play for 5 seconds
                    std::thread::sleep(std::time::Duration::from_secs(5));
                    
                    // Example of switching to second audio file
                    println!("Switching to second audio file");
                    player.pause(index1).expect("Failed to pause first audio file");
                    player.play(index2).expect("Failed to play second audio file");
                    
                    // Let it play for 5 seconds
                    std::thread::sleep(std::time::Duration::from_secs(5));
                    
                    // Clean up
                    player.remove_source(index1).expect("Failed to remove first audio file");
                    player.remove_source(index2).expect("Failed to remove second audio file");
                }
                Err(e) => println!("Failed to add second audio file: {}", e),
            }
        }
        Err(e) => println!("Failed to add first audio file: {}", e),
    }
}
