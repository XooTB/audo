use crate::audio_lib::{init, state};
use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use crate::database::sqlite::entity::progress;
use crate::database::sqlite::entity::progress::Entity as Progress;
use crate::database::sqlite::Db;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use ffmpeg_next as ffmpeg;
use ffmpeg::frame;

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
                    
                    drop(audio_state_guard); // Release the lock before loading
                    
                    if needs_loading {
                        // Load and decode audio
                        let audio_samples = load_audio_file(&book.location)?;
                        
                        // Load samples into player
                        let audio_state_guard = audio_state.lock().unwrap();
                        if let Some(ref player) = audio_state_guard.player {
                            player.clear_buffer();
                            player.load_audio_data(audio_samples);
                        }
                        drop(audio_state_guard);
                        
                        // Update current book
                        let mut audio_state_guard = audio_state.lock().unwrap();
                        audio_state_guard.current_book_id = Some(book.id);
                        drop(audio_state_guard);
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

fn load_audio_file(file_path: &str) -> Result<Vec<f32>, String> {
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
    let sample_rate = decoder.rate();
    let channels = decoder.channels();
    let channel_layout = decoder.channel_layout();
    
    println!("Loading audio - Sample rate: {}Hz, Channels: {}, Layout: {:?}", 
             sample_rate, channels, channel_layout);
    
    // Collect all audio samples
    let mut all_samples = Vec::new();
    
    for (stream, packet) in context.packets() {
        if stream.index() == stream_index {
            decoder.send_packet(&packet)
                .map_err(|e| format!("Failed to send packet: {}", e))?;
            
            let mut frame = frame::Audio::empty();
            while decoder.receive_frame(&mut frame).is_ok() {
                // Convert frame to f32 samples
                let samples = decode_audio_frame(&frame)?;
                
                if !samples.is_empty() {
                    all_samples.extend(samples);
                }
            }
        }
    }
    
    println!("Loaded {} samples from audio file", all_samples.len());
    Ok(all_samples)
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
                // Each channel in its own plane
                for channel in 0..channels {
                    let channel_samples: &[f32] = frame.plane(channel);
                    all_samples.extend_from_slice(channel_samples);
                }
            } else {
                // Interleaved format - all channels in plane 0
                let samples: &[f32] = frame.plane(0);
                all_samples.extend_from_slice(samples);
            }
            Ok(all_samples)
        }
        ffmpeg::format::Sample::I16(_) => {
            // Convert i16 to f32
            let mut f32_samples = Vec::new();
            if is_planar {
                for channel in 0..channels {
                    let channel_samples: &[i16] = frame.plane(channel);
                    for &sample in channel_samples {
                        f32_samples.push(sample as f32 / 32768.0);
                    }
                }
            } else {
                let samples: &[i16] = frame.plane(0);
                for &sample in samples {
                    f32_samples.push(sample as f32 / 32768.0);
                }
            }
            Ok(f32_samples)
        }
        ffmpeg::format::Sample::I32(_) => {
            // Convert i32 to f32
            let mut f32_samples = Vec::new();
            if is_planar {
                for channel in 0..channels {
                    let channel_samples: &[i32] = frame.plane(channel);
                    for &sample in channel_samples {
                        f32_samples.push(sample as f32 / 2147483648.0);
                    }
                }
            } else {
                let samples: &[i32] = frame.plane(0);
                for &sample in samples {
                    f32_samples.push(sample as f32 / 2147483648.0);
                }
            }
            Ok(f32_samples)
        }
        _ => Err(format!("Unsupported audio format: {:?}", format)),
    }
}
