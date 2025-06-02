mod r2d2_adapter;

use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize)]
pub struct ColumnInfo {
    pub name: String,
    pub mime_type: Option<String>,
}

pub enum ColumnValue {
    String(String),
    Integer(i64),
    Float(f64),
    Blob(Vec<u8>),
    Null,
}

impl Serialize for ColumnValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            ColumnValue::String(s) => serializer.serialize_str(s),
            ColumnValue::Integer(i) => serializer.serialize_i64(*i),
            ColumnValue::Float(f) => serializer.serialize_f64(*f),
            ColumnValue::Blob(b) => serializer
                .serialize_str(format!("data:;base64,{}", BASE64_STANDARD.encode(&b)).as_str()),
            ColumnValue::Null => serializer.serialize_none(),
        }
    }
}

#[derive(Serialize)]
pub struct QueryResult {
    pub num_affected: usize,
    pub execution_time_us: u64,
    pub columns: Vec<ColumnInfo>,
    pub rows: Vec<Vec<ColumnValue>>,
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
