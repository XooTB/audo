use crate::m20220101_000001_create_table::Audiobook;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(DeriveIden)]
pub enum Progress {
    Table,
    BookId,
    CurrentChapter,
    ChapterProgress,
    BookProgress,
    CurrentlyReading,
    Status,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Progress::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Progress::BookId)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Progress::CurrentChapter)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Progress::ChapterProgress)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Progress::BookProgress).integer().not_null())
                    .col(
                        ColumnDef::new(Progress::CurrentlyReading)
                            .boolean()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Progress::Status).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("FK_BOOK_ID")
                            .from_tbl(Progress::Table)
                            .from_col(Progress::BookId)
                            .to_tbl(Audiobook::Table)
                            .to_col(Audiobook::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }
}
