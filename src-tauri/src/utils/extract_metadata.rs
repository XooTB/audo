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
        ])
        .arg(file_path);

    let output = command.output().await.map_err(|e| e.to_string())?;
    let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;

    let metadata = parse_ffprobe_output(&stdout)?;
    Ok(metadata)
}
