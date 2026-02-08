CREATE TABLE playback_progress (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL UNIQUE,
    position REAL NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT 0,
    last_listened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES audio_books(id) ON DELETE CASCADE
);

CREATE INDEX idx_playback_progress_book_id ON playback_progress(book_id);
CREATE INDEX idx_playback_progress_last_listened ON playback_progress(last_listened_at DESC);
