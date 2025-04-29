use ffmpeg_next::{self as ffmpeg, format::Input};

pub fn init(file_path: &str) -> Result<ffmpeg::format::context::Input, ffmpeg::Error> {
    ffmpeg::init().expect("Something went wrong while initializing ffmpeg!");

    match ffmpeg::format::input(&file_path) {
        Ok(context) => {
            println!("Successfully parsed the audio file!");
            return Ok(context);
        }
        Err(error) => {
            println!("Error: {}", error);
            return Err(error);
        }
    }
}
