// File for the WASM error wrapper I made.
// This is mostly untested so blame me if there's issues with it, but compiler isn't crying.

use wasm_bindgen::JsValue;
use std::error::Error;
use image::{ImageError};


/// Represents an error in the WASM based sonification engine.
#[derive(Debug, Clone)]
pub struct WASMEngineError {
    pub error : String
}

pub(crate) type WASMEngineResult<T> = Result<T, WASMEngineError>; 

impl WASMEngineError {
    /// Returns a WasmEngineResult::Err(WasmEngineErr) from a JSValue.
    pub(crate) fn into_res_with_err<T>(error : JsValue) -> WASMEngineResult<T> {
        let err = error.into();
        WASMEngineResult::Err(err)
    } 
}

impl std::fmt::Display for WASMEngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "FATAL: WASM engine error: {}", self.error)
    }
}

impl From<std::io::Error> for WASMEngineError {
    fn from(value: std::io::Error) -> Self {
        if let Some(source) = value.source() {
            Result::Err(value.source()).unwrap()
        } else {
            WASMEngineError { error: String::from("Unknown IO error") }
        }
    }
}

impl From<ImageError> for WASMEngineError {
    fn from(value: ImageError) -> Self {
        if let Some(source) = value.source() {
            Result::Err(value.source()).unwrap()
        } else {
            WASMEngineError { error: String::from("Unknown image processing error") }
        }    
    }
}

/// Converts a Result<JSValue, JSValue> into a WasmEngineResult<JsValue>.
pub(crate) fn into_wasm_result(err : Result<impl Into<JsValue>, JsValue>) -> WASMEngineResult<JsValue> {
    match err {
        Result::Err(e) => {
            WASMEngineError::into_res_with_err(e)
        },
        Result::Ok(val) => {
            WASMEngineResult::Ok(val.into())
        }
    }
}

impl From<JsValue> for WASMEngineError {
    fn from(value: JsValue) -> Self {
        WASMEngineError { error: value.as_string().unwrap_or_else(|| { String::from("Unknown JS Error") }) }
    }
}

/// Required conversion for WASM ABI standards
impl From<WASMEngineError> for JsValue {
    fn from(value: WASMEngineError) -> Self {
        JsValue::from_str(&value.error)
    }
}

#[macro_export]
/// Converts a Result<JSValue, JSValue> into a WasmEngineResult<JSValue>, then uses the try operator on the generated Result, then converts the type into the inferred type if it succeeded.
macro_rules! wasm_result_into {
    ($expr : expr) => {
        into_wasm_result($expr)?.into()
    };
}

#[macro_export]
/// Equivelant to return WASMEngineResult::Err(WASMEngineError { cause : $lit })
macro_rules! wasm_bail {
    ($lit : literal) => {
        return WASMEngineResult::Err(WASMEngineError { error : String::from($lit) })
    };
}