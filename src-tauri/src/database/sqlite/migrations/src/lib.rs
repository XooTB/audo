pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20250430_183042_update_books_table;
mod m20250502_045727_metadata_narrator;
mod m20250502_045915_metadata_series;
mod m20250502_050036_metadata_description;
mod m20250513_180706_file_location;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20250430_183042_update_books_table::Migration),
            Box::new(m20250502_045727_metadata_narrator::Migration),
            Box::new(m20250502_045915_metadata_series::Migration),
            Box::new(m20250502_050036_metadata_description::Migration),
            Box::new(m20250513_180706_file_location::Migration),
        ]
    }
}
