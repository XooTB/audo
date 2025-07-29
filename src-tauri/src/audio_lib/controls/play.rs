use crate::audio_lib::{init, state};
use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use crate::database::sqlite::entity::progress;
use crate::database::sqlite::entity::progress::Entity as Progress;
use crate::database::sqlite::Db;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use ffmpeg_next as ffmpeg;
use ffmpeg::frame;
use std::thread;
use std::time::Duration;

#[tauri::command]
pub async fn play(db: tauri::State<'_, Db>) -> Result<(), String> {
    let conn = &*db.inner().0;
    // Get the currently reading book from the DB.
    let book = Progress::find()
        .filter(progress::Column::CurrentlyReading.eq(true))
        .one(conn)
        .await;

    match book {
        Ok(Some(book)) => {
            let book_info = Audiobook::find_by_id(book.book_id).one(conn).await.unwrap();

            if let Some(book) = book_info {
                // Initialize audio player if not already done
                state::initialize_player().map_err(|e| format!("Failed to initialize audio player: {}", e))?;
                
                let audio_state = state::get_audio_state();
                let audio_state_guard = audio_state.lock().unwrap();
                
                if let Some(ref player) = audio_state_guard.player {
                    // Check if already playing
                    if player.is_playing() {
                        println!("Audio is already playing");
                        return Ok(());
                    }
                    
                    // Check if we need to load new audio data
                    let needs_loading = audio_state_guard.current_book_id != Some(book.id) || player.buffer_size() == 0;
                    let target_sample_rate = player.get_sample_rate();
                    let target_channels = player.get_channels();
                    
                    println!("AUDIO DEBUG: Player configured for {}Hz, {} channels", target_sample_rate, target_channels);
                    
                    drop(audio_state_guard); // Release the lock before loading
                    
                    if needs_loading {
                        // Load a reasonable chunk (30 seconds) for good initial experience
                        let initial_samples = load_audio_chunk_with_limit(&book.location, target_sample_rate, target_channels, 30)?;
                        
                        // Load initial chunk into player
                        let audio_state_guard = audio_state.lock().unwrap();
                        if let Some(ref player) = audio_state_guard.player {
                            player.clear_buffer();
                            player.load_audio_data(initial_samples);
                        }
                        drop(audio_state_guard);
                        
                        // Update current book
                        let mut audio_state_guard = audio_state.lock().unwrap();
                        audio_state_guard.current_book_id = Some(book.id);
                        drop(audio_state_guard);
                        
                        // Start background streaming thread
                        start_streaming_thread(&book.location, target_sample_rate, target_channels)?;
                    }
                    
                    // Start playback
                    let audio_state_guard = audio_state.lock().unwrap();
                    if let Some(ref player) = audio_state_guard.player {
                        player.play();
                        println!("Started playing: {}", book.title);
                    }
                } else {
                    return Err("Audio player not available".to_string());
                }
            }

            println!("{:?}", book.status)
        }
        Err(err) => {
            eprint!("error: {}", err)
        }
        Ok(None) => {
            eprint!("error: ")
        }
    }

    Ok(())
}

fn load_audio_chunk_with_limit(file_path: &str, target_sample_rate: u32, target_channels: u16, max_seconds: u32) -> Result<Vec<f32>, String> {
    // Initialize the ffmpeg context
    let mut context = init::init(file_path).map_err(|e| format!("Failed to init ffmpeg: {}", e))?;
    
    // Find the audio stream
    let audio_stream = context
        .streams()
        .best(ffmpeg::media::Type::Audio)
        .ok_or("No audio stream found")?;
    
    let stream_index = audio_stream.index();
    
    // Create decoder for the audio stream
    let codec_context = ffmpeg::codec::context::Context::from_parameters(audio_stream.parameters())
        .map_err(|e| format!("Failed to create codec context: {}", e))?;
    
    let mut decoder = codec_context.decoder().audio()
        .map_err(|e| format!("Failed to create audio decoder: {}", e))?;
    
    // Get audio stream info
    let input_sample_rate = decoder.rate();
    let input_channels = decoder.channels();
    
    println!("Streaming audio - Input: {}Hz, {} channels", input_sample_rate, input_channels);
    println!("Target output: {}Hz, {} channels", target_sample_rate, target_channels);
    
    // Load based on max_seconds parameter 
    let max_samples = target_sample_rate as usize * target_channels as usize * max_seconds as usize;
    let mut chunk_samples = Vec::with_capacity(max_samples);
    println!("Loading up to {} seconds ({} samples)", max_seconds, max_samples);
    
    for (stream, packet) in context.packets() {
        if stream.index() == stream_index {
            decoder.send_packet(&packet)
                .map_err(|e| format!("Failed to send packet: {}", e))?;
            
            let mut frame = frame::Audio::empty();
            while decoder.receive_frame(&mut frame).is_ok() {
                let samples = decode_audio_frame(&frame)?;
                
                if !samples.is_empty() {
                    chunk_samples.extend(samples);
                    
                    // Stop when we reach the time limit
                    if chunk_samples.len() >= max_samples {
                        println!("Reached {} second limit, stopping with {} samples", max_seconds, chunk_samples.len());
                        break;
                    }
                }
            }
            
            // Break from outer loop too
            if chunk_samples.len() >= max_samples {
                break;
            }
        }
    }
    
    println!("Loaded initial chunk: {} samples", chunk_samples.len());
    
    if chunk_samples.is_empty() {
        return Err("No audio samples were decoded from the file".to_string());
    }
    
    // Quick resample if needed (just for the small chunk)
    if input_sample_rate != target_sample_rate || input_channels != target_channels {
        println!("Resampling chunk from {}Hz/{} channels to {}Hz/{} channels", 
                 input_sample_rate, input_channels, target_sample_rate, target_channels);
        let resampled = resample_audio(chunk_samples, input_sample_rate, input_channels as u16, target_sample_rate, target_channels)?;
        println!("Resampled chunk: {} samples", resampled.len());
        Ok(resampled)
    } else {
        println!("No resampling needed, returning {} samples", chunk_samples.len());
        Ok(chunk_samples)
    }
}

fn decode_audio_frame(frame: &frame::Audio) -> Result<Vec<f32>, String> {
    let channels = frame.channels() as usize;
    let samples = frame.samples();
    
    if samples == 0 {
        return Ok(Vec::new());
    }
    
    let format = frame.format();
    let is_planar = frame.is_planar();
    
    match format {
        ffmpeg::format::Sample::F32(_) => {
            let mut all_samples = Vec::new();
            if is_planar {
                // Convert planar to interleaved
                let channel_data: Vec<&[f32]> = (0..channels)
                    .map(|ch| frame.plane(ch))
                    .collect();
                
                // Interleave the samples
                for sample_idx in 0..samples {
                    for ch in 0..channels {
                        if sample_idx < channel_data[ch].len() {
                            all_samples.push(channel_data[ch][sample_idx]);
                        }
                    }
                }
                println!("DECODE DEBUG: Converted planar {} channels, {} samples per channel to {} interleaved samples", 
                         channels, samples, all_samples.len());
            } else {
                // Interleaved format - all channels in plane 0
                let samples: &[f32] = frame.plane(0);
                all_samples.extend_from_slice(samples);
                println!("DECODE DEBUG: Used interleaved format: {} samples", all_samples.len());
            }
            Ok(all_samples)
        }
        ffmpeg::format::Sample::I16(_) => {
            // Convert i16 to f32
            let mut f32_samples = Vec::new();
            if is_planar {
                // Convert planar i16 to interleaved f32
                let channel_data: Vec<&[i16]> = (0..channels)
                    .map(|ch| frame.plane(ch))
                    .collect();
                
                // Interleave while converting to f32
                for sample_idx in 0..samples {
                    for ch in 0..channels {
                        if sample_idx < channel_data[ch].len() {
                            f32_samples.push(channel_data[ch][sample_idx] as f32 / 32768.0);
                        }
                    }
                }
                println!("DECODE DEBUG: Converted planar i16 {} channels to {} interleaved f32 samples", 
                         channels, f32_samples.len());
            } else {
                let samples: &[i16] = frame.plane(0);
                for &sample in samples {
                    f32_samples.push(sample as f32 / 32768.0);
                }
                println!("DECODE DEBUG: Converted interleaved i16 to {} f32 samples", f32_samples.len());
            }
            Ok(f32_samples)
        }
        ffmpeg::format::Sample::I32(_) => {
            // Convert i32 to f32
            let mut f32_samples = Vec::new();
            if is_planar {
                // Convert planar i32 to interleaved f32
                let channel_data: Vec<&[i32]> = (0..channels)
                    .map(|ch| frame.plane(ch))
                    .collect();
                
                // Interleave while converting to f32
                for sample_idx in 0..samples {
                    for ch in 0..channels {
                        if sample_idx < channel_data[ch].len() {
                            f32_samples.push(channel_data[ch][sample_idx] as f32 / 2147483648.0);
                        }
                    }
                }
                println!("DECODE DEBUG: Converted planar i32 {} channels to {} interleaved f32 samples", 
                         channels, f32_samples.len());
            } else {
                let samples: &[i32] = frame.plane(0);
                for &sample in samples {
                    f32_samples.push(sample as f32 / 2147483648.0);
                }
                println!("DECODE DEBUG: Converted interleaved i32 to {} f32 samples", f32_samples.len());
            }
            Ok(f32_samples)
        }
        _ => Err(format!("Unsupported audio format: {:?}", format)),
    }
}

fn resample_audio(
    input_samples: Vec<f32>,
    input_sample_rate: u32,
    input_channels: u16,
    target_sample_rate: u32,
    target_channels: u16,
) -> Result<Vec<f32>, String> {
    let input_channels = input_channels as usize;
    let target_channels = target_channels as usize;
    
    // Step 1: Handle channel conversion first
    let channel_converted = if input_channels == target_channels {
        input_samples
    } else if input_channels == 1 && target_channels == 2 {
        // Mono to stereo: duplicate each sample
        let mut stereo_samples = Vec::with_capacity(input_samples.len() * 2);
        for sample in input_samples {
            stereo_samples.push(sample);
            stereo_samples.push(sample);
        }
        stereo_samples
    } else if input_channels == 2 && target_channels == 1 {
        // Stereo to mono: average the channels
        let mut mono_samples = Vec::with_capacity(input_samples.len() / 2);
        for chunk in input_samples.chunks_exact(2) {
            mono_samples.push((chunk[0] + chunk[1]) / 2.0);
        }
        mono_samples
    } else {
        // For other cases, take the first target_channels or pad with zeros
        let input_frames = input_samples.len() / input_channels;
        let mut converted = Vec::with_capacity(input_frames * target_channels);
        for frame_idx in 0..input_frames {
            for ch in 0..target_channels {
                if ch < input_channels {
                    converted.push(input_samples[frame_idx * input_channels + ch]);
                } else {
                    converted.push(0.0);
                }
            }
        }
        converted
    };
    
    // Step 2: Handle sample rate conversion
    if input_sample_rate == target_sample_rate {
        return Ok(channel_converted);
    }
    
    let ratio = target_sample_rate as f64 / input_sample_rate as f64;
    let input_frames = channel_converted.len() / target_channels;
    let target_frames = (input_frames as f64 * ratio) as usize;
    
    println!("RESAMPLE DEBUG: {}Hz -> {}Hz (ratio: {:.3}), {} -> {} frames", 
             input_sample_rate, target_sample_rate, ratio, input_frames, target_frames);
    
    let mut output_samples = Vec::with_capacity(target_frames * target_channels);
    
    for target_frame in 0..target_frames {
        let source_frame_f = target_frame as f64 / ratio;
        let source_frame = source_frame_f as usize;
        let frac = source_frame_f - source_frame as f64;
        
        for ch in 0..target_channels {
            let sample = if source_frame + 1 < input_frames {
                // Linear interpolation
                let sample1 = channel_converted[source_frame * target_channels + ch];
                let sample2 = channel_converted[(source_frame + 1) * target_channels + ch];
                sample1 * (1.0 - frac as f32) + sample2 * frac as f32
            } else if source_frame < input_frames {
                // Last frame, no interpolation
                channel_converted[source_frame * target_channels + ch]
            } else {
                // Beyond input, silence
                0.0
            };
            
            output_samples.push(sample);
        }
    }
    
    Ok(output_samples)
}

fn start_streaming_thread(file_path: &str, target_sample_rate: u32, target_channels: u16) -> Result<(), String> {
    let file_path = file_path.to_string();
    
    thread::spawn(move || {
        println!("Starting background audio streaming thread");
        
        // Small delay to let initial playback start
        thread::sleep(Duration::from_millis(500));
        
        loop {
            let audio_state = state::get_audio_state();
            let audio_state_guard = audio_state.lock().unwrap();
            
            if let Some(ref player) = audio_state_guard.player {
                // Check if we need more audio data
                let buffer_size = player.buffer_size();
                let is_playing = player.is_playing();
                
                // If playing and buffer is getting low, load more
                if is_playing && buffer_size < (target_sample_rate as usize * target_channels as usize * 2) {
                    drop(audio_state_guard); // Release lock before heavy operation
                    
                    match load_next_audio_chunk(&file_path, target_sample_rate, target_channels) {
                        Ok(samples) => {
                            let audio_state_guard = audio_state.lock().unwrap();
                            if let Some(ref player) = audio_state_guard.player {
                                player.load_audio_data(samples);
                                println!("Loaded additional audio chunk, buffer size: {}", player.buffer_size());
                            }
                        }
                        Err(e) => {
                            println!("Error loading next chunk: {}", e);
                            break;
                        }
                    }
                } else if !is_playing {
                    // Stop streaming when not playing
                    drop(audio_state_guard);
                    break;
                } else {
                    drop(audio_state_guard);
                }
            } else {
                drop(audio_state_guard);
                break;
            }
            
            // Check every 100ms
            thread::sleep(Duration::from_millis(100));
        }
        
        println!("Background streaming thread ended");
    });
    
    Ok(())
}

fn load_next_audio_chunk(file_path: &str, target_sample_rate: u32, target_channels: u16) -> Result<Vec<f32>, String> {
    // Load another 10 second chunk - in a full implementation this would track position
    // This is a simplified version that will just reload from start (not ideal but works for testing)
    load_audio_chunk_with_limit(file_path, target_sample_rate, target_channels, 10)
}
