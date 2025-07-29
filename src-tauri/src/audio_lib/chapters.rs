use core::fmt;
use ffmpeg_next as ffmpeg;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BookChapter {
    pub id: i32,
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

        // Handle potential conversion error safely
        match id.try_into() {
            Ok(chapter_id) => {
                chapters.push(BookChapter {
                    id: chapter_id,
                    title,
                    start,
                    end,
                });
            }
            Err(e) => {
                eprintln!("Warning: Failed to convert chapter ID {} to i32, skipping chapter: {}", id, e);
                continue;
            }
        }
    }

    // If no chapters were found or parsed successfully, create a default chapter
    if chapters.is_empty() {
        println!("No chapters found in audio file, creating default chapter");
        chapters.push(BookChapter {
            id: 1,
            title: "Chapter 1".to_string(),
            start: 0,
            end: context.duration() as i64, // Use the file's total duration
        });
    }

    return chapters;
}
