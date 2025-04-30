use ffmpeg_next as ffmpeg;

#[derive(Debug)]
pub struct BookMetadata {
    title: String,
    author: String,
    narrator: String,
    series: String,
    description: String,
}

pub fn extract_metadata(context: &ffmpeg::format::context::Input) -> BookMetadata {
    let metadata = context.metadata();

    return BookMetadata {
        title: metadata.get("title").unwrap_or("Untitled").to_owned(),
        author: metadata.get("artist").unwrap_or("Unknown").to_owned(),
        narrator: metadata.get("composer").unwrap_or("Unknown").to_owned(),
        series: metadata.get("album").unwrap_or("Untitled").to_owned(),
        description: metadata
            .get("comment")
            .unwrap_or("No Description avialable!")
            .to_owned(),
    };
}
