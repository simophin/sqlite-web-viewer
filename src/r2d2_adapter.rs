use crate::{CellValue, ColumnInfo, Query, QueryResult, QueryResults};
use anyhow::Context;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::fallible_iterator::{FallibleIterator, IteratorExt};
use rusqlite::params_from_iter;
use rusqlite::types::Value;
use std::time::Instant;

impl super::Queryable for r2d2::Pool<SqliteConnectionManager> {
    fn query<'a>(
        &self,
        _run_in_transaction: bool,
        queries: impl Iterator<Item = &'a Query>,
    ) -> anyhow::Result<QueryResults> {
        let mut conn = self.get().context("Error getting a connection")?;
        let tx = conn.transaction().context("Error starting transaction")?;

        let start = Instant::now();
        let results: Vec<QueryResult> = queries
            .map(|Query { sql, params }| {
                let mut stmt = tx.prepare(sql).context("Error preparing SQL")?;
                let columns: Vec<_> = stmt
                    .column_names()
                    .into_iter()
                    .map(|name| ColumnInfo {
                        name: name.to_string(),
                    })
                    .collect();

                let rows: Vec<Vec<CellValue>>;
                let mut num_affected = 0;

                if stmt.readonly() {
                    rows = stmt
                        .query(params_from_iter(params.iter()))
                        .context("Error executing SQL")?
                        .map(|row| {
                            let mut row_data = Vec::with_capacity(columns.len());
                            for col in 0..columns.len() {
                                row_data.push(match row.get::<_, Value>(col)? {
                                    Value::Blob(v) => CellValue::Blob(v),
                                    Value::Null => CellValue::Null,
                                    Value::Integer(v) => CellValue::Integer(v),
                                    Value::Real(v) => CellValue::Float(v),
                                    Value::Text(v) => CellValue::String(v),
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

                anyhow::Ok(QueryResult {
                    num_affected,
                    columns,
                    rows,
                })
            })
            .transpose_into_fallible()
            .collect()?;

        tx.commit().context("Error committing transaction")?;

        let execution_time_us = start.elapsed().as_micros() as u64;
        Ok(QueryResults {
            execution_time_us,
            results,
        })
    }
}
