use core::fmt;
use ffmpeg_next as ffmpeg;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BookChapter {
    id: i64,
    title: String,
    start: i64,
    end: i64,
}

impl std::fmt::Display for BookChapter {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "id: {}, title: {}, start: {}, end: {}",
            self.id, self.title, self.start, self.end
        )
    }
}

pub fn get_chapters(context: &ffmpeg::format::context::Input) -> Vec<BookChapter> {
    let mut chapters: Vec<BookChapter> = vec![];

    for chapter in context.chapters() {
        let id = chapter.id();
        let metadata = chapter.metadata();
        let title = metadata.get("title").unwrap_or("Untitled").to_owned();
        let start = chapter.start();
        let end = chapter.end();

        chapters.push(BookChapter {
            id,
            title,
            start,
            end,
        });
    }

    return chapters;
}
