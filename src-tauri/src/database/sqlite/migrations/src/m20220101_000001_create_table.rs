use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
pub enum Audiobook {
    Table,
    Id,
    Title,
    Author,
    Series,
    Chapters,
    Narrator,
    Description,
    Location,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Audiobook::Table)
                    .if_not_exists()
                    .col(pk_auto(Audiobook::Id))
                    .col(string(Audiobook::Title))
                    .col(string(Audiobook::Author))
                    .col(string(Audiobook::Series))
                    .col(string(Audiobook::Chapters))
                    .col(string(Audiobook::Narrator))
                    .col(string(Audiobook::Description))
                    .col(string(Audiobook::Location))
                    .to_owned(),
            )
            .await
    }
}
