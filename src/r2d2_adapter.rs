use crate::QueryResult;
use anyhow::Context;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::fallible_iterator::FallibleIterator;
use rusqlite::params_from_iter;
use rusqlite::types::Value;
use std::collections::HashMap;
use std::time::Instant;

impl super::Queryable for r2d2::Pool<SqliteConnectionManager> {
    fn query(&self, sql: &str, params: &[String]) -> anyhow::Result<QueryResult> {
        let conn = self.get().context("Error getting a connection")?;
        let mut stmt = conn.prepare(sql).context("Error preparing SQL")?;
        let columns = stmt
            .column_names()
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>();

        let start = Instant::now();
        let rows: Vec<Vec<String>>;
        let mut num_affected = 0;
        let mut columns_info = HashMap::new();

        if stmt.readonly() {
            rows = stmt
                .query(params_from_iter(params.iter()))
                .context("Error executing SQL")?
                .map(|row| {
                    let mut row_data = Vec::with_capacity(columns.len());
                    for col in 0..columns.len() {
                        let column_name = columns[col].as_str();
                        row_data.push(match row.get::<_, Value>(col)? {
                            Value::Blob(v) => {
                                if !columns_info.contains_key(column_name) {
                                    columns_info.insert(
                                        column_name.to_string(),
                                        super::ColumnInfo {
                                            mime_type: Some(
                                                infer::Infer::new()
                                                    .get(&v)
                                                    .map(|s| s.mime_type())
                                                    .unwrap_or("application/octet-stream")
                                                    .to_string(),
                                            ),
                                        },
                                    );
                                }
                                BASE64_STANDARD.encode(&v)
                            }
                            Value::Null => "NULL".to_string(),
                            Value::Integer(v) => v.to_string(),
                            Value::Real(v) => v.to_string(),
                            Value::Text(v) => {
                                if !columns_info.contains_key(column_name) {
                                    columns_info.insert(
                                        column_name.to_string(),
                                        super::ColumnInfo {
                                            mime_type: Some(infer_text_type(&v)),
                                        },
                                    );
                                }
                                v
                            }
                        });
                    }
                    Ok(row_data)
                })
                .collect()
                .context("Error converting row")?;
        } else {
            num_affected = stmt
                .execute(params_from_iter(params.iter()))
                .context("Error executing SQL")?;
            rows = vec![];
        }

        Ok(QueryResult {
            num_affected,
            columns,
            execution_time_us: start.elapsed().as_micros() as u64,
            rows,
            columns_info,
        })
    }
}

fn infer_text_type(text: &str) -> String {
    use serde_json::*;
    let is_json = if text.starts_with('{') && text.ends_with('}') {
        from_str::<Map<String, Value>>(text).is_ok()
    } else if text.starts_with('[') && text.ends_with(']') {
        from_str::<Vec<Value>>(text).is_ok()
    } else {
        false
    };

    if is_json {
        "application/json".to_string()
    } else {
        "text/plain".to_string()
    }
}
