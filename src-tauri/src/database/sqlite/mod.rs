pub mod controllers;
pub mod db;
pub mod entity;
pub mod run_migrations;

use sea_orm::DbConn;
use std::sync::Arc;

#[derive(Clone)]
pub struct Db(pub Arc<DbConn>);
