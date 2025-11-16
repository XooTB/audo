use rodio::{source::Source, Decoder, OutputStream};
use std::fs::File;

#[tauri::command]
pub async fn play() {
    let file_path = "/home/XooT/audiobooks/audiobook_1.m4b";
    let file = File::open(&file_path).unwrap();

    let stream_handle = rodio::OutputStreamBuilder::open_default_stream()
        .expect("Unable to open the default stream!");
    let sink = rodio::Sink::connect_new(&stream_handle.mixer());

    let source = Decoder::try_from(file).unwrap();

    stream_handle.mixer().add(source);
}
