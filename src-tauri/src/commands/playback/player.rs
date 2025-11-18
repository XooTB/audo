
use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};
use std::{fs::File, io::BufReader};

pub struct AudioPlayer {
    pub current_track: Option<OutputStream>,
    pub _stream: Option<OutputStream>,
    pub stream_handle: Option<rodio::OutputStream>,
    pub sink: Option<Sink>,
    pub source: Option<Decoder<BufReader<File>>>,
}

impl AudioPlayer {
    pub fn new() -> Self {
        Self {
            current_track: None,
            _stream: None,
            stream_handle: None,
            sink: None,
            source: None,
        }
    }

    pub fn init(&mut self) -> Result<(), String> {
        // Initialize the player
        let stream_handle = OutputStreamBuilder::open_default_stream()
            .map_err(|e| format!("Unable to open default stream: {:?}", e))?;

        // Set the default stream_handle
        self.stream_handle = Some(stream_handle);
        
        // Initialize the sink
        let sink= Sink::connect_new(&self.stream_handle.as_ref().unwrap().mixer());

        // Add the source to the sink
        self.sink = Some(sink);

        Ok(())
    }

    pub fn update_source(&mut self, file_path: &str) -> Result<(), String> {
        let file = File::open(&file_path).map_err(|e| e.to_string())?;
        let audio_buf = BufReader::new(file);

        let source = Decoder::new(audio_buf)
            .map_err(|err| format!("Unable to decode the input file!: {:?}", err))?;

        self.source = Some(source);
        Ok(())
    }

    pub fn play(&mut self) -> Result<(), String> {
        // If the source is set, check if it's already appended with the sink
        if let Some(source) = self.source.take() {
            if self.sink.as_mut().unwrap().len() == 0 {
                println!("Appending source to the sink...");
                self.sink.as_mut().unwrap().append(source);
            } else {
                println!("Source already appended to the sink, playing...");
                self.sink.as_mut().unwrap().play();
            }
        } else {
            return Err("No source found".to_string());
        }
        Ok(())
    }

    pub fn pause(&mut self) -> Result<(), String> {
        if let Some(sink) = self.sink.as_mut() {
            sink.pause();
            println!("Sink paused!")
        } else {
            return Err("No sink found".to_string());
        }
        Ok(())
    }

}
