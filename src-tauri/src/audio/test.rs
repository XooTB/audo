use ffmpeg_next as ffmpeg;

pub fn audio_test() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize FFmpeg
    ffmpeg::init()?;

    // Open the input file
    let mut ictx = ffmpeg::format::input("../../test-audio/harvard.wav")?;

    // Iterate over streams in the file
    for stream in ictx.streams() {
        // Get codec parameters for each stream
        let codec_params = stream.parameters();
        println!("Stream: {} ({:?})", stream.index(), codec_params.medium());

        // Check if the stream is audio
        if codec_params.medium() == ffmpeg::media::Type::Audio {
            // Find the codec for the audio stream
            let codec = ffmpeg::codec::decoder::find(codec_params.id())
                .ok_or("Codec not found for stream")?;
            println!("Audio Codec: {:?}", codec.name());
        }
    }

    Ok(())
}

