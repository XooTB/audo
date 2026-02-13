CREATE TABLE chapters (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    title TEXT NULL,
    FOREIGN KEY (book_id) REFERENCES audio_books(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapters_book_id ON chapters(book_id);
