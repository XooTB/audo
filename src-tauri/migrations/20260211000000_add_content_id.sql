ALTER TABLE audio_books ADD COLUMN content_id TEXT NULL;
ALTER TABLE audio_books ADD COLUMN identity_method TEXT NULL;
ALTER TABLE audio_books ADD COLUMN asin TEXT NULL;
ALTER TABLE audio_books ADD COLUMN isbn TEXT NULL;
CREATE INDEX idx_audio_books_content_id ON audio_books(content_id);
