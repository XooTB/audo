use serde::{Deserialize, Serialize};
use tauri_plugin_shell::ShellExt;

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
}

// Structs to parse ffprobe JSON output
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct FfprobeOutput {
    format: Format,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct Format {
    duration: Option<String>,
    size: Option<String>,
    start_time: Option<String>,
    tags: Option<Tags>,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct Tags {
    title: Option<String>,
    artist: Option<String>,
    composer: Option<String>,
    date: Option<String>,
    description: Option<String>,
    comment: Option<String>,
    album_artist: Option<String>,
}

#[tauri::command]
pub async fn extract_metadata(app: tauri::AppHandle, file_path: &str) -> Result<Metadata, String> {
    let command = app
        .shell()
        .sidecar("ffprobe")
        .unwrap()
        .args(&["-v", "quiet", "-print_format", "json", "-show_format"])
        .arg(file_path);

    // Execute the command and get output
    let output = command.output().await.map_err(|e| e.to_string())?;

    // Convert stdout bytes to string
    let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;

    // Parse JSON output
    let ffprobe_data: FfprobeOutput = serde_json::from_str(&stdout).map_err(|e| e.to_string())?;

    // Extract metadata from ffprobe output
    let tags = ffprobe_data.format.tags.as_ref();

    let metadata = Metadata {
        title: tags
            .and_then(|t| t.title.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        author: tags
            .and_then(|t| t.artist.clone().or_else(|| t.album_artist.clone()))
            .unwrap_or_else(|| "Unknown".to_string()),
        narrator: tags
            .and_then(|t| t.composer.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        duration: ffprobe_data
            .format
            .duration
            .unwrap_or_else(|| "Unknown".to_string()),
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
    };

    Ok(metadata)
}
