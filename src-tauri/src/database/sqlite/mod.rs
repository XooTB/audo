pub mod db;
pub mod init;
pub mod run_migrations;

use sea_orm::DbConn;
use std::sync::Arc;

#[derive(Clone)]
pub struct Db(pub Arc<DbConn>);
