/// Audio module.
/// This is the structs used to actually give audio to the browser, including the simple AudioDevice used for facilitating pixel based sonifications, and AudioWorkletDevice for AudioWorklet real time processing. 
use std::collections::{HashMap};
use crate::{sonify::error::*, wasm_bail, wasm_result_into, sonify::error::*};
use palette::white_point::B;
use wasm_bindgen::prelude::*;
use web_sys::{console::log_1 as console_log, js_sys::{*}, *};



/// Represents a dynamic AudioContext which can easily swap out it's buffer contexts to play different continous sounds, and a BiquadFilterNode to adjust pitch. 
#[wasm_bindgen]
pub(crate) struct AudioDevice {
    ctx : AudioContext,
    buf_len : u32,
    buffer_source : AudioBufferSourceNode,
    amp : GainNode,
    filter : BiquadFilterNode
} 

#[wasm_bindgen]
impl AudioDevice {
    /// Constructs a new AudioDevice which can dynamically change audio input, with an empty buffer supplied.
    #[wasm_bindgen(constructor)]
    pub fn new(amplify : f32, buf_len : u32) -> WASMEngineResult<AudioDevice> {
        let default_opts = AudioContextOptions::new();
        default_opts.set_sample_rate(48000.0);
        let mut new_ctx : AudioContext = wasm_result_into!(AudioContext::new_with_context_options(&default_opts));
        let mut empty_buf : AudioBuffer = wasm_result_into!(new_ctx.create_buffer(1u32, buf_len, new_ctx.sample_rate()));
        let mut buf_source : AudioBufferSourceNode = wasm_result_into!(new_ctx.create_buffer_source());
        let mut new_gain : GainNode = wasm_result_into!(new_ctx.create_gain());
        let mut filter : BiquadFilterNode = wasm_result_into!(new_ctx.create_biquad_filter());
        new_gain.gain().set_value(amplify);
        new_gain.connect_with_audio_node(&new_ctx.destination());
        buf_source.set_buffer(Some(&empty_buf));
        buf_source.connect_with_audio_node(&filter);
        filter.connect_with_audio_node(&new_gain);
        new_gain.gain().set_value(amplify);                
        new_gain.connect_with_audio_node(&new_ctx.destination());

        let mut device = Self {
            ctx : new_ctx,
            buf_len : buf_len,
            buffer_source : buf_source,
            amp : new_gain,
            filter : filter
        };

        Ok(device)
    }

    /// Sets whether the AudioDevice will loop it's current buffer.
    #[wasm_bindgen]
    pub fn set_loop(&mut self, value : bool) -> () {
        self.buffer_source.set_loop(value);
    }

    /// Wires a new AudioBuffer by creating a new AudioBufferSourceNode and wiring the given AudioBuffer to it. 
    pub fn wire_new_audio_buffer(&mut self, new_buffer : AudioBuffer) -> WASMEngineResult<()> {
        self.buffer_source.stop();
        let possible_source : AudioBufferSourceNode = wasm_result_into!(AudioBufferSourceNode::new(&self.ctx));
        self.buffer_source = possible_source;
        self.buffer_source.set_buffer(Some(&new_buffer));
        self.buffer_source.connect_with_audio_node(&self.amp);
        Ok(())
    }

    /// Changes the detune property of the internal AudioBufferSourceNode, which changes the pitch in cents.
    #[wasm_bindgen]
    pub fn set_pitch(&mut self, new_pitch : f32) -> WASMEngineResult<()> {
        self.filter.frequency().set_value(new_pitch);
        Ok(())
    }

    /// Takes a float, duplicates it to cover **seconds** amount of seconds over the context's sample rate and sets that as the AudioDevice's current buffer. 
    #[wasm_bindgen]
    pub fn numeric_into_buffer(&mut self, numeric : f32, duration : u32) -> WASMEngineResult<()> {
        let vec_len = self.ctx.sample_rate() as u32 * duration; 
        let mut buf : Vec<f32> = Vec::with_capacity(vec_len as usize);
        let mut new_buf : AudioBuffer = wasm_result_into!(AudioBuffer::new(&AudioBufferOptions::new(vec_len, self.ctx.sample_rate())));
        
        for i in 0..vec_len {
            let rnd = Math::random() * 2.0 - 1.0;
            buf.push(rnd as f32 * numeric); 
        }
        
        new_buf.copy_to_channel(&buf, 0);
        self.wire_new_audio_buffer(new_buf);
        Ok(())
    }

    /// Changes the gain on the GainNode inside the AudioDevice.
    #[wasm_bindgen]
    pub fn change_gain(&mut self, new_gain : f32) -> () {
        self.amp.gain().set_value(new_gain);
    }

    /// Sets the playback on the AudioDevice. Pass in true to start, false to stop.
    #[wasm_bindgen]
    pub fn set_playback(&mut self, value : bool) -> WASMEngineResult<()> {
        if value {
            if let Err(e) = self.buffer_source.start() {
                return WASMEngineError::into_res_with_err(e.into());
            };
            if let Err(e) = self.ctx.resume() {
                return WASMEngineError::into_res_with_err(e.into());
            }
            Ok(())
        } else {
            let _ = self.buffer_source.stop();
            Ok(())
        }
    }
}

