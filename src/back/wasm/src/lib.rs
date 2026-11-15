#![allow(unused, nonstandard_style, non_snake_case, clippy::unused_unit, rust_analyzer::inactive_code, deprecated)]
mod sonify;

use console_error_panic_hook;
use wasm_bindgen::prelude::*;

/// Hooks rust errors to JS.
#[wasm_bindgen(start)]
pub fn err_hook() {
    console_error_panic_hook::set_once();
}