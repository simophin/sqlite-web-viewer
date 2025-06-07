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
}

pub enum CellValue {
    String(String),
    Integer(i64),
    Float(f64),
    Blob(Vec<u8>),
    Null,
}

impl Serialize for CellValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            CellValue::String(s) => serializer.serialize_str(s),
            CellValue::Integer(i) => serializer.serialize_i64(*i),
            CellValue::Float(f) => serializer.serialize_f64(*f),
            CellValue::Blob(b) => {
                let mime_type = infer::Infer::new()
                    .get(&b)
                    .map(|info| info.mime_type())
                    .unwrap_or_default();

                serializer.serialize_str(
                    format!("data:{mime_type};base64,{}", BASE64_STANDARD.encode(&b)).as_str(),
                )
            }
            CellValue::Null => serializer.serialize_none(),
        }
    }
}

#[derive(Serialize)]
pub struct QueryResults {
    pub execution_time_us: u64,
    pub results: Vec<QueryResult>,
}

#[derive(Serialize)]
pub struct QueryResult {
    pub num_affected: usize,
    pub columns: Vec<ColumnInfo>,
    pub rows: Vec<Vec<CellValue>>,
}

#[derive(Deserialize)]
pub struct Query {
    pub sql: String,
    #[serde(default)]
    pub params: Vec<String>,
}

#[derive(Deserialize)]
pub struct Request {
    pub queries: Vec<Query>,
    pub run_in_transaction: bool,
}

pub trait Queryable {
    fn query<'a>(
        &self,
        run_in_transaction: bool,
        quries: impl Iterator<Item = &'a Query>,
    ) -> anyhow::Result<QueryResults>;
}

pub struct DBState<Q> {
    pub query: Q,
}

pub async fn execute_query(
    State(state): State<Arc<DBState<impl Queryable>>>,
    Json(Request {
        queries,
        run_in_transaction,
    }): Json<Request>,
) -> Response {
    match state.query.query(run_in_transaction, queries.iter()) {
        Ok(r) => (StatusCode::OK, Json(r)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, format!("{e:?}")).into_response(),
    }
}
