mod r2d2_adapter;

use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Serialize)]
pub struct ColumnInfo {
    pub mime_type: Option<String>,
}

#[derive(Serialize)]
pub struct QueryResult {
    pub num_affected: usize,
    pub execution_time_us: u64,
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub columns_info: HashMap<String, ColumnInfo>,
}

#[derive(Deserialize)]
pub struct Query {
    pub sql: String,
    #[serde(default)]
    pub params: Vec<String>,
}

pub trait Queryable {
    fn query(&self, sql: &str, params: &[String]) -> anyhow::Result<QueryResult>;
}

pub struct DBState {
    pub query: Box<dyn Queryable + Send + Sync>,
}

pub async fn execute_query(
    State(state): State<Arc<DBState>>,
    Json(Query { sql, params }): Json<Query>,
) -> Response {
    match state.query.query(&sql, &params) {
        Ok(r) => (StatusCode::OK, Json(r)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("{e:?}")).into_response(),
    }
}
