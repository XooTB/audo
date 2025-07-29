use crate::audio_lib::init;
use crate::database::sqlite::entity::audiobook::Entity as Audiobook;
use crate::database::sqlite::entity::progress;
use crate::database::sqlite::entity::progress::Entity as Progress;
use crate::database::sqlite::Db;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use ffmpeg_next as ffmpeg;
use ffmpeg::frame;
use std::collections::VecDeque;

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
                // Initialize the ffmpeg context
                let mut context = init::init(&book.location).unwrap();
                
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
                
                // Get audio stream info for resampling
                let sample_rate = decoder.rate();
                let channels = decoder.channels();
                let channel_layout = decoder.channel_layout();
                
                println!("Audio info - Sample rate: {}Hz, Channels: {}, Layout: {:?}", 
                         sample_rate, channels, channel_layout);
                
                // Decode and process audio frames
                let mut audio_buffer: VecDeque<Vec<f32>> = VecDeque::new();
                
                for (stream, packet) in context.packets() {
                    if stream.index() == stream_index {
                        decoder.send_packet(&packet)
                            .map_err(|e| format!("Failed to send packet: {}", e))?;
                        
                        let mut frame = frame::Audio::empty();
                        while decoder.receive_frame(&mut frame).is_ok() {
                            // Convert frame to f32 samples
                            let samples = decode_audio_frame(&frame)?;
                            
                            // For now, store raw samples - resampling can be added later if needed
                            if !samples.is_empty() {
                                audio_buffer.push_back(samples);
                            }
                        }
                    }
                }
                
                println!("Successfully decoded {} audio frames", audio_buffer.len());
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
