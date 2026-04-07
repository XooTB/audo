use sqlx::Type;

#[derive(Debug, Clone, Copy, Type)]
pub enum ConfigKey {
    FrontendMode,
}

#[derive(sqlx::FromRow)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
}

impl ConfigKey {
    pub fn as_str(&self) -> &'static str {
        match self {
            ConfigKey::FrontendMode => "frontend_mode",
        }
    }
}

impl std::str::FromStr for ConfigKey {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "frontend_mode" => Ok(ConfigKey::FrontendMode),
            _ => Err(format!("unknown config key: {s}")),
        }
    }
}

impl std::fmt::Display for ConfigKey {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}
