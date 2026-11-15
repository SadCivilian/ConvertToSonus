use std::sync::{LazyLock};
use sonus_macros::{lazy};
use anyhow::*;
use axum::{handler::*, response::*, routing::*};
use serde::{Serialize, Deserialize};
use serde_json::{self as json, json, from_value, ser, Value};

#[derive(Deserialize, Serialize)]
pub(crate) struct JustAString {
    string : String
}

// NOTE: Yes, this is unused. We were supposed to have an API and time limitations didn't allow for it. Plus integrating a single threaded WASM server to run performance critical code was a bad idea in the first place.