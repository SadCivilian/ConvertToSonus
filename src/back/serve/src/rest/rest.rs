use std::{env::{current_exe, home_dir}, io, path::PathBuf};
use anyhow::*;
use axum::{Router, ServiceExt, extract::Request, http::{HeaderValue, header::CONTENT_TYPE}, middleware::{Next, from_fn}, response::{IntoResponse, Json}, routing::*, serve::*};
use tower_http::services::ServeDir;
use tokio::net::*;

use super::handlers::*;

/// The serve type that serves the frontend with the local listener.
pub type FrontendServe = Serve<TcpListener, Router, Router>;

/// Returns a Router that serves the local files/has handles for API requests.
fn create_router_with_handlers() -> Router {
    /// This frontend router is currently stateless.
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR")); // HACK: CARGO_MANIFEST_DIR points to the current bin being ran, we just pop from this for guaranteed success
    path.pop(); 
    path.pop(); 
    path.push("front");
    let frontend_serve = ServeDir::new(path);
    let mut web_router = Router::<()>::new().nest_service("/assets", frontend_serve);
    web_router
}

/// Serves the frontend to localhost, and return the listener.
pub async fn start_front() -> anyhow::Result<FrontendServe>  {
    let web_router = create_router_with_handlers(); 
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("ConvertToSonus server now running on local port: {}", listener.local_addr().unwrap());
    Ok(serve(listener, web_router)) 
}