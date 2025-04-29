use ffmpeg_next::{self as ffmpeg, format::stream::Disposition};
use std::fs;
use std::{fs::File, io::Write, path::Path};

pub fn extract_cover(mut context: ffmpeg::format::context::Input) {
    let cover_stream = &context
        .streams()
        .best(ffmpeg::media::Type::Video)
        .expect("No Cover stream found!");
    if cover_stream
        .disposition()
        .contains(Disposition::ATTACHED_PIC)
    {
        let cover_stream_index = cover_stream.index();

        // Iterate over packaets to find the one with cover art.

        for (stream, packet) in context.packets() {
            if stream.index() == cover_stream_index {
                save_cover("covers", "cover.jpg", packet.data().unwrap())
                    .expect("Failed to save cover art!");
                break;
            }
        }
    } else {
        println!("No embedded cover art found.")
    }
}

fn save_cover(directory: &str, filename: &str, data: &[u8]) -> std::io::Result<()> {
    // First create the relative path
    let directory = if directory.starts_with("/") {
        &directory[1..]
    } else {
        directory
    };

    if !Path::new(directory).exists() {
        fs::create_dir_all(directory)?;
    }

    // Create the full file path
    let filepath = Path::new(directory).join(filename);

    // Create and write to the file!
    let mut file: File = File::create(&filepath)?;
    file.write_all(data)?;

    Ok(())
}
