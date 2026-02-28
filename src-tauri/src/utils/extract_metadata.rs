use serde::{Deserialize, Serialize};
use tauri_plugin_shell::ShellExt;

use super::content_id::generate_content_id;

#[derive(Serialize, Deserialize, Debug)]
pub struct Metadata {
    pub title: String,
    pub author: String,
    pub narrator: String,
    pub duration: String,
    pub start_time: String,
    pub size: String,
    pub description: String,
    pub date: String,
    pub asin: Option<String>,
    pub isbn: Option<String>,
    pub content_id: Option<String>,
    pub identity_method: Option<String>,
    pub chapters: Vec<Chapter>,
}

// Structs to parse ffprobe JSON output
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct FfprobeOutput {
    pub format: Format,
    pub chapters: Vec<FfprobeChapter>,
    pub streams: Option<Vec<FfprobeStream>>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct FfprobeStream {
    pub codec_type: Option<String>,
    pub codec_name: Option<String>,
    pub disposition: Option<FfprobeDisposition>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct FfprobeDisposition {
    pub attached_pic: Option<i32>,
}

// Intermediate struct for deserializing ffprobe's nested chapter format
#[derive(Deserialize, Debug)]
pub struct FfprobeChapter {
    pub id: i32,
    pub start_time: String,
    pub end_time: String,
    pub tags: ChapterTags,
}

#[derive(Deserialize, Debug)]
pub struct ChapterTags {
    pub title: Option<String>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Chapter {
    pub id: i32,
    pub start_time: String,
    pub end_time: String,
    pub title: Option<String>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct Format {
    pub duration: Option<String>,
    pub size: Option<String>,
    pub start_time: Option<String>,
    pub bit_rate: Option<String>,
    pub tags: Option<Tags>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct Tags {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub composer: Option<String>,
    pub date: Option<String>,
    pub description: Option<String>,
    pub comment: Option<String>,
    pub album_artist: Option<String>,
    #[serde(alias = "ASIN", alias = "AUDIBLE_ASIN")]
    pub asin: Option<String>,
    #[serde(alias = "ISBN")]
    pub isbn: Option<String>,
}

/// Parse ffprobe JSON output into Metadata. This is the core logic,
/// independent of Tauri, so it can be tested standalone.
pub fn parse_ffprobe_output(ffprobe_json: &str) -> Result<Metadata, String> {
    let ffprobe_data: FfprobeOutput =
        serde_json::from_str(ffprobe_json).map_err(|e| e.to_string())?;

    // println!("FFprobe Chapters: {:?}", &ffprobe_data.chapters);

    let tags = ffprobe_data.format.tags.as_ref();

    // Flatten chapters by extracting title from nested tags
    let chapters: Vec<Chapter> = ffprobe_data
        .chapters
        .into_iter()
        .map(|ch| Chapter {
            id: ch.id,
            start_time: ch.start_time,
            end_time: ch.end_time,
            title: ch.tags.title,
        })
        .collect();

    let title = tags
        .and_then(|t| t.title.clone())
        .unwrap_or_else(|| "Unknown".to_string());
    let author = tags
        .and_then(|t| t.artist.clone().or_else(|| t.album_artist.clone()))
        .unwrap_or_else(|| "Unknown".to_string());
    let duration_str = ffprobe_data
        .format
        .duration
        .unwrap_or_else(|| "Unknown".to_string());

    let duration_f64 = duration_str.parse::<f64>().unwrap_or(0.0);
    let identity = generate_content_id(&title, &author, duration_f64);

    Ok(Metadata {
        title,
        author,
        narrator: tags
            .and_then(|t| t.composer.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        duration: duration_str,
        size: ffprobe_data
            .format
            .size
            .unwrap_or_else(|| "Unknown".to_string()),
        start_time: ffprobe_data
            .format
            .start_time
            .unwrap_or_else(|| "Unknown".to_string()),
        date: tags
            .and_then(|t| t.date.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        description: tags
            .and_then(|t| t.description.clone().or_else(|| t.comment.clone()))
            .unwrap_or_else(|| "Unknown".to_string()),
        asin: tags.and_then(|t| t.asin.clone()),
        isbn: tags.and_then(|t| t.isbn.clone()),
        content_id: identity.content_id,
        identity_method: identity.identity_method,
        chapters,
    })
}

#[tauri::command]
pub async fn extract_metadata(app: tauri::AppHandle, file_path: &str) -> Result<Metadata, String> {
    let command = app
        .shell()
        .sidecar("ffprobe")
        .unwrap()
        .args(&[
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_chapters",
            "-show_streams",
        ])
        .arg(file_path);

    let output = command.output().await.map_err(|e| e.to_string())?;
    let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;

    let metadata = parse_ffprobe_output(&stdout)?;
    Ok(metadata)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn full_ffprobe_json() -> String {
        r#"{
            "format": {
                "duration": "21083.5",
                "size": "350000000",
                "start_time": "0.000000",
                "bit_rate": "128000",
                "tags": {
                    "title": "The Hitchhiker's Guide to the Galaxy",
                    "artist": "Douglas Adams",
                    "composer": "Stephen Fry",
                    "date": "2005",
                    "description": "A great sci-fi comedy",
                    "ASIN": "B0009JKV9W",
                    "ISBN": "978-0345391803"
                }
            },
            "chapters": [
                {
                    "id": 0,
                    "start_time": "0.000000",
                    "end_time": "600.000000",
                    "tags": { "title": "Chapter 1" }
                },
                {
                    "id": 1,
                    "start_time": "600.000000",
                    "end_time": "1200.000000",
                    "tags": { "title": "Chapter 2" }
                }
            ]
        }"#
        .to_string()
    }

    #[test]
    fn test_parse_complete_metadata() {
        let result = parse_ffprobe_output(&full_ffprobe_json()).unwrap();

        assert_eq!(result.title, "The Hitchhiker's Guide to the Galaxy");
        assert_eq!(result.author, "Douglas Adams");
        assert_eq!(result.narrator, "Stephen Fry");
        assert_eq!(result.duration, "21083.5");
        assert_eq!(result.size, "350000000");
        assert_eq!(result.start_time, "0.000000");
        assert_eq!(result.date, "2005");
        assert_eq!(result.description, "A great sci-fi comedy");
        assert_eq!(result.asin.as_deref(), Some("B0009JKV9W"));
        assert_eq!(result.isbn.as_deref(), Some("978-0345391803"));
    }

    #[test]
    fn test_parse_chapters_flattened() {
        let result = parse_ffprobe_output(&full_ffprobe_json()).unwrap();

        assert_eq!(result.chapters.len(), 2);
        assert_eq!(result.chapters[0].id, 0);
        assert_eq!(result.chapters[0].start_time, "0.000000");
        assert_eq!(result.chapters[0].end_time, "600.000000");
        assert_eq!(result.chapters[0].title.as_deref(), Some("Chapter 1"));
        assert_eq!(result.chapters[1].id, 1);
        assert_eq!(result.chapters[1].start_time, "600.000000");
        assert_eq!(result.chapters[1].end_time, "1200.000000");
        assert_eq!(result.chapters[1].title.as_deref(), Some("Chapter 2"));
    }

    #[test]
    fn test_parse_missing_tags_defaults_to_unknown() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "size": "100000"
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();

        assert_eq!(result.title, "Unknown");
        assert_eq!(result.author, "Unknown");
        assert_eq!(result.narrator, "Unknown");
        assert_eq!(result.date, "Unknown");
        assert_eq!(result.description, "Unknown");
        assert!(result.asin.is_none());
        assert!(result.isbn.is_none());
    }

    #[test]
    fn test_parse_invalid_json_returns_error() {
        let result = parse_ffprobe_output("not valid json");
        assert!(result.is_err());
    }

    #[test]
    fn test_artist_fallback_to_album_artist() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "tags": {
                    "title": "My Book",
                    "album_artist": "Fallback Author",
                    "composer": "Narrator Name"
                }
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();
        assert_eq!(result.author, "Fallback Author");
    }

    #[test]
    fn test_asin_via_audible_asin_alias() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "tags": {
                    "title": "My Book",
                    "artist": "Author",
                    "AUDIBLE_ASIN": "B00AUDIBLE1"
                }
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();
        assert_eq!(result.asin.as_deref(), Some("B00AUDIBLE1"));
    }

    #[test]
    fn test_content_id_generated_when_known() {
        let result = parse_ffprobe_output(&full_ffprobe_json()).unwrap();

        assert!(result.content_id.is_some());
        assert_eq!(result.identity_method.as_deref(), Some("composite"));
    }

    #[test]
    fn test_content_id_none_when_unknown_author() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "tags": {
                    "title": "My Book"
                }
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();
        assert!(result.content_id.is_none());
        assert!(result.identity_method.is_none());
    }

    #[test]
    fn test_no_chapters() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "tags": {
                    "title": "My Book",
                    "artist": "Author"
                }
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();
        assert!(result.chapters.is_empty());
    }

    #[test]
    fn test_description_falls_back_to_comment() {
        let json = r#"{
            "format": {
                "duration": "3600.0",
                "tags": {
                    "title": "My Book",
                    "artist": "Author",
                    "comment": "This is a comment description"
                }
            },
            "chapters": []
        }"#;

        let result = parse_ffprobe_output(json).unwrap();
        assert_eq!(result.description, "This is a comment description");
    }
}
