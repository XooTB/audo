use sha2::{Digest, Sha256};

pub struct ContentIdentity {
    pub content_id: Option<String>,
    pub identity_method: Option<String>,
}

/// Normalize text: lowercase, strip trailing parentheticals, strip keywords,
/// remove non-alphanumeric (keep spaces and unicode letters), collapse whitespace,
/// optionally strip leading articles.
fn normalize_text(input: &str, strip_articles: bool) -> String {
    let mut s = input.to_lowercase();

    // Strip trailing parenthetical phrases like "(Unabridged)", "(Audiobook)"
    while let Some(start) = s.rfind('(') {
        if s.ends_with(')') {
            s = s[..start].to_string();
        } else {
            break;
        }
    }

    // Strip known keywords
    let keywords = [
        "unabridged",
        "abridged",
        "audiobook",
        "complete edition",
        "audio edition",
    ];
    for kw in &keywords {
        s = s.replace(kw, " ");
    }

    // Remove non-alphanumeric characters (preserve spaces and unicode letters)
    s = s
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == ' ' {
                c
            } else {
                ' '
            }
        })
        .collect();

    // Collapse whitespace and trim
    s = s.split_whitespace().collect::<Vec<&str>>().join(" ");

    // Strip leading articles
    if strip_articles {
        for article in &["the ", "a ", "an "] {
            if s.starts_with(article) {
                s = s[article.len()..].to_string();
                break;
            }
        }
    }

    s
}

/// Normalize author: split on delimiters, normalize each name, sort, join with "|".
fn normalize_author(input: &str) -> String {
    let delimiters = [", ", " & ", " and "];
    let mut names: Vec<String> = vec![input.to_string()];

    for delim in &delimiters {
        names = names
            .iter()
            .flat_map(|name| name.split(delim).map(|s| s.to_string()).collect::<Vec<_>>())
            .collect();
    }

    let mut normalized: Vec<String> = names
        .iter()
        .map(|name| normalize_text(name, false))
        .filter(|name| !name.is_empty())
        .collect();

    normalized.sort();
    normalized.join("|")
}

/// Bucket duration: round to nearest 60 seconds. Returns "unknown" if zero or negative.
fn bucket_duration(seconds: f64) -> String {
    if seconds <= 0.0 {
        return "unknown".to_string();
    }
    let rounded = ((seconds / 60.0).round() * 60.0) as i64;
    rounded.to_string()
}

/// Generate a content_id from title, author, and duration.
/// Returns None content_id if title or author is "Unknown".
pub fn generate_content_id(title: &str, author: &str, duration: f64) -> ContentIdentity {
    if title.eq_ignore_ascii_case("unknown") || author.eq_ignore_ascii_case("unknown") {
        return ContentIdentity {
            content_id: None,
            identity_method: None,
        };
    }

    let norm_title = normalize_text(title, true);
    let norm_author = normalize_author(author);
    let dur_bucket = bucket_duration(duration);

    let input = format!("composite:{}|{}|{}", norm_title, norm_author, dur_bucket);

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hex = format!("{:x}", result);

    ContentIdentity {
        content_id: Some(hex),
        identity_method: Some("composite".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hitchhikers_guide() {
        let id1 = generate_content_id(
            "The Hitchhiker's Guide to the Galaxy (Unabridged)",
            "Douglas Adams",
            21083.0,
        );
        assert!(id1.content_id.is_some());
        assert_eq!(id1.identity_method.as_deref(), Some("composite"));

        // Same book, slightly different metadata
        let id2 = generate_content_id(
            "the hitchhiker's guide to the galaxy",
            "douglas adams",
            21050.0, // within same 60s bucket (both round to 21060)
        );
        assert_eq!(id1.content_id, id2.content_id);
    }

    #[test]
    fn test_unknown_title_returns_none() {
        let id = generate_content_id("Unknown", "Douglas Adams", 3600.0);
        assert!(id.content_id.is_none());
        assert!(id.identity_method.is_none());
    }

    #[test]
    fn test_unknown_author_returns_none() {
        let id = generate_content_id("Some Book", "Unknown", 3600.0);
        assert!(id.content_id.is_none());
    }

    #[test]
    fn test_multiple_authors_sorted() {
        let id1 = generate_content_id("Some Book", "Author B & Author A", 3600.0);
        let id2 = generate_content_id("Some Book", "Author A, Author B", 3600.0);
        assert_eq!(id1.content_id, id2.content_id);
    }

    #[test]
    fn test_duration_bucketing() {
        assert_eq!(bucket_duration(3542.5), "3540");
        assert_eq!(bucket_duration(0.0), "unknown");
        assert_eq!(bucket_duration(-1.0), "unknown");
    }
}
