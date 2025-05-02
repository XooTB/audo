use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
enum Audiobook {
    Table,
    Id,
    Title,
    Author,
    Chapters,
    Narrator,
    Series,
    Description,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Audiobook::Table)
                    .add_column(string(Audiobook::Description))
                    .to_owned(),
            )
            .await
    }
}
