use axum::Router;
use axum::routing::post;
use r2d2_sqlite::SqliteConnectionManager;
use sqlite_web_viewer::{DBState, execute_query};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .with_target(false)
        .init();

    let pool = SqliteConnectionManager::file(
        std::env::var("SQLITE_DB_PATH").expect("SQLITE_DB_PATH must be set"),
    );
    let pool = r2d2::Pool::builder()
        .max_size(10)
        .build(pool)
        .expect("Failed to create pool");

    let cors = CorsLayer::new()
        .allow_origin(Any) // or use `allow_origin("https://example.com".parse().unwrap())`
        .allow_methods(Any) // or `.allow_methods([Method::GET, Method::POST])`
        .allow_headers(Any);

    let app = Router::new()
        .route("/query", post(execute_query))
        .layer(cors)
        .with_state(Arc::new(DBState { query: pool }));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    tracing::info!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
