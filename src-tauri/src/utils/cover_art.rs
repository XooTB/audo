use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use serde::Deserialize;
use tauri_plugin_shell::ShellExt;

fn hash_path(path: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    hasher.finish()
}

#[derive(Deserialize)]
struct StreamsJson {
    streams: Option<Vec<StreamEntry>>,
}

#[derive(Deserialize)]
struct StreamEntry {
    codec_type: Option<String>,
    disposition: Option<DispositionEntry>,
}

#[derive(Deserialize)]
struct DispositionEntry {
    attached_pic: Option<i32>,
}

/// Detect if ffprobe JSON output contains an embedded cover art stream.
/// Returns true if any stream has codec_type == "video" AND disposition.attached_pic == 1.
/// Pure function — no I/O, no side effects.
pub fn detect_cover_stream(ffprobe_json: &str) -> bool {
    let parsed: StreamsJson = match serde_json::from_str(ffprobe_json) {
        Ok(p) => p,
        Err(_) => return false,
    };
    parsed.streams.unwrap_or_default().iter().any(|stream| {
        stream.codec_type.as_deref() == Some("video")
            && stream
                .disposition
                .as_ref()
                .and_then(|d| d.attached_pic)
                .unwrap_or(0)
                == 1
    })
}

/// Extract embedded cover art from an audio file using ffmpeg sidecar.
/// Returns Ok(true) if extraction succeeded and output file exists,
/// Ok(false) if ffmpeg exited non-zero (no cover art — not an error),
/// Err only for real failures (sidecar not found, spawn error, etc.).
pub async fn extract_cover_art(
    app: &tauri::AppHandle,
    audio_path: &str,
    output_path: &std::path::Path,
) -> Result<bool, String> {
    let command = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args(&["-i", audio_path, "-an", "-vcodec", "copy"])
        .arg(output_path.to_str().ok_or("Invalid output path")?);

    let output = command.output().await.map_err(|e| e.to_string())?;
    if output.status.success() && output_path.exists() {
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Scan the audio file's parent directory for common cover image filenames.
/// Priority order: cover, folder, album, front, poster.
/// Checks .jpg, .jpeg, .png — case-insensitive.
/// Pure function — takes path, returns path. No Tauri dependency.
pub fn find_folder_cover(audio_path: &str) -> Option<String> {
    let audio_path = std::path::Path::new(audio_path);
    let parent = audio_path.parent()?;

    let entries: Vec<_> = match std::fs::read_dir(parent) {
        Ok(rd) => rd.filter_map(|e| e.ok()).collect(),
        Err(_) => return None,
    };

    let names = ["cover", "folder", "album", "front", "poster"];
    let extensions = ["jpg", "jpeg", "png"];

    for name in &names {
        for ext in &extensions {
            let expected = format!("{}.{}", name, ext);
            for entry in &entries {
                let filename = entry.file_name();
                let filename_lower = filename.to_string_lossy().to_lowercase();
                if filename_lower == expected {
                    return entry.path().to_str().map(|s| s.to_string());
                }
            }
        }
    }
    None
}

/// Get cover art for an audio file.
/// Tries embedded extraction first; falls back to folder cover scan.
/// Copies the found cover into covers_dir with a hash-based unique name.
/// Returns the path to the cover in covers_dir, or empty string if nothing found.
pub async fn get_cover_art(
    app: &tauri::AppHandle,
    audio_path: &str,
    covers_dir: &std::path::Path,
) -> Result<String, String> {
    let hash = hash_path(audio_path);
    let embedded_output = covers_dir.join(format!("{}.jpg", hash));

    match extract_cover_art(app, audio_path, &embedded_output).await {
        Ok(true) => return Ok(embedded_output.to_str().unwrap_or("").to_string()),
        Ok(false) => {}
        Err(_) => {}
    }

    if let Some(folder_cover_path) = find_folder_cover(audio_path) {
        let src = std::path::Path::new(&folder_cover_path);
        let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("jpg");
        let dest = covers_dir.join(format!("{}.{}", hash, ext));
        std::fs::copy(src, &dest).map_err(|e| e.to_string())?;
        return Ok(dest.to_str().unwrap_or("").to_string());
    }

    Ok("".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_cover_stream_with_attached_pic() {
        let json = r#"{
            "streams": [
                {
                    "codec_type": "video",
                    "codec_name": "mjpeg",
                    "disposition": { "attached_pic": 1 }
                },
                {
                    "codec_type": "audio",
                    "codec_name": "aac",
                    "disposition": { "attached_pic": 0 }
                }
            ],
            "format": { "duration": "3600.0", "tags": {} },
            "chapters": []
        }"#;
        assert!(detect_cover_stream(json));
    }

    #[test]
    fn test_detect_cover_stream_audio_only() {
        let json = r#"{
            "streams": [
                {
                    "codec_type": "audio",
                    "codec_name": "aac",
                    "disposition": { "attached_pic": 0 }
                }
            ],
            "format": { "duration": "3600.0" },
            "chapters": []
        }"#;
        assert!(!detect_cover_stream(json));
    }

    #[test]
    fn test_detect_cover_stream_video_not_attached() {
        let json = r#"{
            "streams": [
                {
                    "codec_type": "video",
                    "codec_name": "h264",
                    "disposition": { "attached_pic": 0 }
                }
            ],
            "format": {},
            "chapters": []
        }"#;
        assert!(!detect_cover_stream(json));
    }

    #[test]
    fn test_detect_cover_stream_no_streams_key() {
        let json = r#"{
            "format": { "duration": "3600.0" },
            "chapters": []
        }"#;
        assert!(!detect_cover_stream(json));
    }

    #[test]
    fn test_detect_cover_stream_empty_streams_array() {
        let json = r#"{
            "streams": [],
            "format": {},
            "chapters": []
        }"#;
        assert!(!detect_cover_stream(json));
    }

    #[test]
    fn test_detect_cover_stream_invalid_json() {
        assert!(!detect_cover_stream("not valid json"));
    }

    fn make_test_dir(tag: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("audo_test_{}", hash_path(tag)));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_find_folder_cover_finds_cover_jpg() {
        let dir = make_test_dir("cover_jpg_test");
        std::fs::write(dir.join("cover.jpg"), b"fake image").unwrap();

        let result = find_folder_cover(dir.join("audiobook.m4b").to_str().unwrap());
        std::fs::remove_dir_all(&dir).unwrap();

        assert!(result.is_some());
        assert!(result.unwrap().ends_with("cover.jpg"));
    }

    #[test]
    fn test_find_folder_cover_case_insensitive() {
        let dir = make_test_dir("cover_uppercase_test");
        std::fs::write(dir.join("Cover.JPG"), b"fake image").unwrap();

        let result = find_folder_cover(dir.join("audiobook.m4b").to_str().unwrap());
        std::fs::remove_dir_all(&dir).unwrap();

        assert!(result.is_some());
    }

    #[test]
    fn test_find_folder_cover_priority_folder_before_album() {
        let dir = make_test_dir("priority_test");
        std::fs::write(dir.join("folder.jpg"), b"fake").unwrap();
        std::fs::write(dir.join("album.png"), b"fake").unwrap();

        let result = find_folder_cover(dir.join("audiobook.m4b").to_str().unwrap());
        std::fs::remove_dir_all(&dir).unwrap();

        assert!(result.is_some());
        assert!(result.unwrap().contains("folder.jpg"));
    }

    #[test]
    fn test_find_folder_cover_finds_png() {
        let dir = make_test_dir("cover_png_test");
        std::fs::write(dir.join("album.png"), b"fake image").unwrap();

        let result = find_folder_cover(dir.join("audiobook.m4b").to_str().unwrap());
        std::fs::remove_dir_all(&dir).unwrap();

        assert!(result.is_some());
        assert!(result.unwrap().ends_with("album.png"));
    }

    #[test]
    fn test_find_folder_cover_no_images_returns_none() {
        let dir = make_test_dir("no_images_test");
        std::fs::write(dir.join("audiobook.m4b"), b"").unwrap();

        let result = find_folder_cover(dir.join("audiobook.m4b").to_str().unwrap());
        std::fs::remove_dir_all(&dir).unwrap();

        assert!(result.is_none());
    }

    #[test]
    fn test_find_folder_cover_nonexistent_dir_returns_none() {
        let result = find_folder_cover("/nonexistent/dir/audio.m4b");
        assert!(result.is_none());
    }
}
