use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
enum CurrentBook {
    Table,
    Id,
    Title,
    Description,
    CurrentChapter,
    CurrentProgress,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(CurrentBook::Table)
                    .if_not_exists()
                    .col(pk_auto(CurrentBook::Id))
                    .col(string(CurrentBook::Title))
                    .col(string(CurrentBook::Description))
                    .col(string(CurrentBook::CurrentChapter))
                    .col(
                        ColumnDef::new(CurrentBook::CurrentProgress)
                            .integer()
                            .not_null()
                            .default(Value::Int(Some(0))),
                    )
                    .to_owned(),
            )
            .await
    }
}
