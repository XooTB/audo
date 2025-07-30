use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Stream, StreamConfig, SupportedStreamConfig};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

pub struct AudioPlayer {
    _stream: Option<Stream>,
    audio_buffer: Arc<Mutex<VecDeque<f32>>>,
    is_playing: Arc<AtomicBool>,
    sample_rate: u32,
    channels: u16,
    is_headless: bool,
    buffer_position: Arc<AtomicUsize>,
}

impl AudioPlayer {
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        // Try different hosts in order of preference
        let hosts = cpal::available_hosts();
        println!("Available audio hosts: {:?}", hosts);
        
        let mut last_error = None;
        
        // Try different audio backends, prefer ALSA on Linux
        let preferred_hosts = [
            #[cfg(target_os = "linux")]
            cpal::HostId::Alsa,
        ];
        
        for &host_id in &preferred_hosts {
            if hosts.contains(&host_id) {
                match Self::try_create_with_host(host_id) {
                    Ok(player) => return Ok(player),
                    Err(e) => {
                        println!("Failed to create audio player with {:?}: {}", host_id, e);
                        last_error = Some(e);
                    }
                }
            }
        }
        
        // Fallback to default host
        println!("Trying default host as fallback");
        match Self::try_create_with_default_host() {
            Ok(player) => Ok(player),
            Err(e) => {
                println!("Failed to create audio player with default host: {}", e);
                println!("Creating headless audio player (no sound output)");
                Self::create_headless_player()
            }
        }
    }
    
    fn create_headless_player() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let audio_buffer: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::new()));
        let is_playing = Arc::new(AtomicBool::new(false));
        let buffer_position = Arc::new(AtomicUsize::new(0));
        
        Ok(AudioPlayer {
            _stream: None,
            audio_buffer,
            is_playing,
            sample_rate: 44100,
            channels: 2,
            is_headless: true,
            buffer_position,
        })
    }
    
    fn try_create_with_host(host_id: cpal::HostId) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let host = cpal::host_from_id(host_id)?;
        let device = host
            .default_output_device()
            .ok_or("No default output device available")?;

        let config = device.default_output_config()?;
        let sample_rate = config.sample_rate().0;
        let channels = config.channels();

        println!("Using audio host: {:?}", host_id);
        println!("Audio device: {}", device.name()?);
        println!("Default config: {:?}", config);

        let audio_buffer: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::new()));
        let is_playing = Arc::new(AtomicBool::new(false));
        let buffer_position = Arc::new(AtomicUsize::new(0));

        let stream = Self::create_stream(&device, &config, audio_buffer.clone(), is_playing.clone(), buffer_position.clone())?;

        Ok(AudioPlayer {
            _stream: Some(stream),
            audio_buffer,
            is_playing,
            sample_rate,
            channels,
            is_headless: false,
            buffer_position,
        })
    }
    
    fn try_create_with_default_host() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or("No default output device available")?;

        let config = device.default_output_config()?;
        let sample_rate = config.sample_rate().0;
        let channels = config.channels();

        println!("Audio device: {}", device.name()?);
        println!("Default config: {:?}", config);

        let audio_buffer: Arc<Mutex<VecDeque<f32>>> = Arc::new(Mutex::new(VecDeque::new()));
        let is_playing = Arc::new(AtomicBool::new(false));
        let buffer_position = Arc::new(AtomicUsize::new(0));

        let stream = Self::create_stream(&device, &config, audio_buffer.clone(), is_playing.clone(), buffer_position.clone())?;

        Ok(AudioPlayer {
            _stream: Some(stream),
            audio_buffer,
            is_playing,
            sample_rate,
            channels,
            is_headless: false,
            buffer_position,
        })
    }

    fn create_stream(
        device: &Device,
        config: &SupportedStreamConfig,
        audio_buffer: Arc<Mutex<VecDeque<f32>>>,
        is_playing: Arc<AtomicBool>,
        buffer_position: Arc<AtomicUsize>,
    ) -> Result<Stream, Box<dyn std::error::Error + Send + Sync>> {
        let config: StreamConfig = config.clone().into();
        let channels = config.channels as usize;

        let stream = device.build_output_stream(
            &config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                if !is_playing.load(Ordering::Relaxed) {
                    // Fill with silence when paused
                    for sample in data.iter_mut() {
                        *sample = 0.0;
                    }
                    return;
                }

                let mut buffer = audio_buffer.lock().unwrap();
                let buffer_size = buffer.len();
                
                if buffer_size == 0 {
                    println!("Audio callback: buffer empty, filling with silence");
                } else if buffer_size % 44100 == 0 {
                    // Log periodically (every second worth of samples)
                    println!("Audio callback: buffer has {} samples", buffer_size);
                }
                
                for frame in data.chunks_mut(channels) {
                    if buffer.is_empty() {
                        // No more audio data, fill with silence
                        for sample in frame.iter_mut() {
                            *sample = 0.0;
                        }
                    } else {
                        // Fill frame with available audio data
                        for sample in frame.iter_mut() {
                            *sample = buffer.pop_front().unwrap_or(0.0);
                        }
                    }
                }
                
                // Update buffer position for tracking
                buffer_position.store(buffer.len(), Ordering::Relaxed);
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )?;

        stream.play()?;
        Ok(stream)
    }

    pub fn load_audio_data(&self, samples: Vec<f32>) {
        let mut buffer = self.audio_buffer.lock().unwrap();
        buffer.extend(samples);
        println!("Loaded {} samples into audio buffer", buffer.len());
    }

    pub fn play(&self) {
        self.is_playing.store(true, Ordering::Relaxed);
        println!("Audio player started");
    }

    pub fn pause(&self) {
        self.is_playing.store(false, Ordering::Relaxed);
        println!("Audio player paused");
    }

    pub fn is_playing(&self) -> bool {
        self.is_playing.load(Ordering::Relaxed)
    }

    pub fn clear_buffer(&self) {
        let mut buffer = self.audio_buffer.lock().unwrap();
        buffer.clear();
        self.buffer_position.store(0, Ordering::Relaxed);
        println!("Audio buffer cleared");
    }

    pub fn buffer_size(&self) -> usize {
        let buffer = self.audio_buffer.lock().unwrap();
        buffer.len()
    }

    pub fn get_sample_rate(&self) -> u32 {
        self.sample_rate
    }

    pub fn get_channels(&self) -> u16 {
        self.channels
    }

    pub fn is_headless(&self) -> bool {
        self.is_headless
    }

    pub fn get_buffer_position(&self) -> usize {
        self.buffer_position.load(Ordering::Relaxed)
    }

    pub fn reset_buffer_position(&self) {
        self.buffer_position.store(0, Ordering::Relaxed);
    }
}

unsafe impl Send for AudioPlayer {}
unsafe impl Sync for AudioPlayer {}
