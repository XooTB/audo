use ffmpeg_next::{self as ffmpeg};

pub fn init(file_path: &str) -> Result<ffmpeg::format::context::Input, ffmpeg::Error> {
    // Initialize ffmpeg with proper error handling
    if let Err(e) = ffmpeg::init() {
        eprintln!("Failed to initialize ffmpeg: {}", e);
        return Err(e);
    }

    // Validate file path
    if file_path.is_empty() {
        eprintln!("Error: File path is empty");
        return Err(ffmpeg::Error::InvalidData);
    }

    // Check if file exists before trying to open it
    if !std::path::Path::new(file_path).exists() {
        eprintln!("Error: File does not exist: {}", file_path);
        return Err(ffmpeg::Error::InvalidData);
    }

    match ffmpeg::format::input(&file_path) {
        Ok(context) => {
            println!("Successfully parsed the audio file: {}", file_path);
            Ok(context)
        }
        Err(error) => {
            eprintln!("Error parsing audio file '{}': {}", file_path, error);
            Err(error)
        }
    }
}
