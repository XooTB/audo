use crate::audio_lib::chapters;
use crate::audio_lib::init;
use crate::audio_lib::metadata;

pub fn import_book(book_path: &str) {
    let context =
        init::init(&book_path).expect("Something went wrong while parsing the audio file.");
    let book_metadata = metadata::extract_metadata(&context);
    let chapters = chapters::get_chapters(&context);

    println!("Metadata: {:?}", book_metadata);
    for i in 0..10 {
        println!("Chapter Info: {}", chapters[i])
    }
}
