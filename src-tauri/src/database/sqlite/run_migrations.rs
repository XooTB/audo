use sea_orm::DatabaseConnection;
use tracing::{error, info};

// Import the Migrator from your migration crate
use migration::Migrator;
use sea_orm_migration::MigratorTrait;

pub async fn run_migrations(db: &DatabaseConnection) -> Result<(), String> {
    info!("Deleting all tables & Running database migrations...");

    // Check pending migrations
    match Migrator::get_pending_migrations(db).await {
        Ok(pending) => {
            if pending.is_empty() {
                info!("No pending migrations to apply");
            } else {
                info!("Found {} pending migrations", pending.len());

                // Apply pending migrations
                match Migrator::fresh(db).await {
                    Ok(_) => info!("Successfully applied all migrations"),
                    Err(e) => {
                        error!("Failed to apply migrations: {}", e);
                        return Err(format!("Migration failed: {}", e));
                    }
                }
            }
        }
        Err(e) => {
            error!("Failed to check pending migrations: {}", e);
            return Err(format!("Failed to check pending migrations: {}", e));
        }
    }

    // match Migrator::fresh(db).await {
    //     Ok(_) => info!("Succesfully applied all migrations!"),
    //     Err(e) => {
    //         error!("Failed to apply migrations: {e}");
    //         return Err(format!("Migration Failed: {e}"));
    //     }
    // }

    info!("Database migration process completed");
    Ok(())
}

// Optional: Add a utility function to check migration status
// pub async fn check_migration_status(db: &DatabaseConnection) -> Result<Vec<String>, DbErr> {
//     let applied_migrations = Migrator::get_applied_migrations(db).await?;
//     Ok(applied_migrations)
// }
