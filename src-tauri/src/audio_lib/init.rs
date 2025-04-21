use ffmpeg_next as ffmpeg;

pub fn init(file_path: &str) -> Result<(), ffmpeg::Error> {
    ffmpeg::init().expect("Something went wrong while initializing ffmpeg!");

    match ffmpeg::format::input(&file_path) {
        Ok(mut context) => {
            println!("Successfully parsed the audio file!")
        }
        Err(error) => println!("Error: {}", error),
    }

    Ok(())
}
