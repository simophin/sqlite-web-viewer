use crate::{ColumnInfo, ColumnValue, QueryResult};
use anyhow::Context;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::fallible_iterator::FallibleIterator;
use rusqlite::params_from_iter;
use rusqlite::types::Value;
use std::time::Instant;

impl super::Queryable for r2d2::Pool<SqliteConnectionManager> {
    fn query(&self, sql: &str, params: &[String]) -> anyhow::Result<QueryResult> {
        let conn = self.get().context("Error getting a connection")?;
        let mut stmt = conn.prepare(sql).context("Error preparing SQL")?;
        let mut columns: Vec<_> = stmt
            .column_names()
            .into_iter()
            .map(|name| ColumnInfo {
                name: name.to_string(),
                mime_type: None,
            })
            .collect();

        let start = Instant::now();
        let rows: Vec<Vec<ColumnValue>>;
        let mut num_affected = 0;

        if stmt.readonly() {
            rows = stmt
                .query(params_from_iter(params.iter()))
                .context("Error executing SQL")?
                .map(|row| {
                    let mut row_data = Vec::with_capacity(columns.len());
                    for col in 0..columns.len() {
                        row_data.push(match row.get::<_, Value>(col)? {
                            Value::Blob(v) => {
                                if columns[col].mime_type.is_none() {
                                    columns[col].mime_type.replace(
                                        infer::Infer::new()
                                            .get(&v)
                                            .map(|s| s.mime_type())
                                            .unwrap_or("application/octet-stream")
                                            .to_string(),
                                    );
                                }

                                ColumnValue::Blob(v)
                            }
                            Value::Null => ColumnValue::Null,
                            Value::Integer(v) => ColumnValue::Integer(v),
                            Value::Real(v) => ColumnValue::Float(v),
                            Value::Text(v) => {
                                if columns[col].mime_type.is_none() {
                                    columns[col].mime_type.replace(infer_text_type(&v));
                                }

                                ColumnValue::String(v)
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
