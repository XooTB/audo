use ffmpeg_next as ffmpeg;

pub fn get_chapters(context: &ffmpeg::format::context::Input) {
    for chapter in context.chapters() {
        let id = chapter.id();
        let metadata = chapter.metadata();
        let title = metadata.get("title").unwrap_or("Untitled");
        let start = chapter.start();
        let end = chapter.end();

        println!(
            "ID: {}, Title: {}, start: {}, end: {}",
            id, title, start, end
        );
    }
}
