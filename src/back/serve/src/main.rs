#![allow(unused, nonstandard_style, non_snake_case, clippy::unused_unit)]
use tokio;
use tower_http;
mod rest;

#[tokio::main]
async fn main() {
    /// Start frontend server
    rest::rest::start_front().await.unwrap().await.unwrap()
}
