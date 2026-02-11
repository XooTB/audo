use std::env;
use std::process::Command;

use audo_lib::utils::parse_ffprobe_output;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: extract_metadata <file_path> [file_path...]");
        std::process::exit(1);
    }

    // Use bundled ffprobe if it exists next to the binary, otherwise fall back to system ffprobe
    let ffprobe = env::current_exe()
        .ok()
        .and_then(|exe| {
            let dir = exe.parent()?;
            let bundled = dir.join("../binaries/ffmpeg/bin/ffprobe-x86_64-unknown-linux-gnu");
            bundled
                .exists()
                .then(|| bundled.to_string_lossy().to_string())
        })
        .unwrap_or_else(|| "ffprobe".to_string());

    for file_path in &args[1..] {
        println!("--- {} ---", file_path);

        let output = Command::new(&ffprobe)
            .args([
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_chapters",
            ])
            .arg(file_path)
            .output();

        match output {
            Ok(output) => {
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    eprintln!("ffprobe failed: {}", stderr);
                    continue;
                }

                let stdout = match String::from_utf8(output.stdout) {
                    Ok(s) => s,
                    Err(e) => {
                        eprintln!("Invalid UTF-8 output: {}", e);
                        continue;
                    }
                };

                match parse_ffprobe_output(&stdout) {
                    Ok(metadata) => {
                        println!(
                            "Printing metadata: {}",
                            serde_json::to_string_pretty(&metadata).unwrap()
                        )
                    }
                    Err(e) => eprintln!("Failed to parse metadata: {}", e),
                }
            }
            Err(e) => eprintln!("Failed to run ffprobe: {}", e),
        }
    }
}
