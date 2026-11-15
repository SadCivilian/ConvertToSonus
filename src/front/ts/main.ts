import init, {SonificationResultJSON, AudioDevice, sonify_pixel, SonificationLegend, NoiseParameter} from "../pkg/wasm.js"
import { doc_child, print, unrecog_css_hack } from "../js/utils.js"
import { pixel_at_current_frame, pixel_on_canvas, switch_to_canvas_mode, switch_to_playback_mode, recreate_canvas } from "../js/video.js";
import { wire_on_interact, wire_move } from "../js/generic_touch_event.js";

// initializes the WASM
async function run() {
    await init()
    console.log("WASM initialized")
}

await run()


/**
 * 
 * Fetches the SonificationLegend objects to feed into the sonification engine.
 * 
 */
async function prep_sonification_legend_objects() {
    const loader = async (url : string) => {
        let response = await fetch(url)
        if (!response.ok) {
            alert("Failed to load critical assets, you should probably reload the webpage")
            throw new Error(`Failed to load ${url}`)
        } else {
            let resp_text = await response.text()
            return new SonificationLegend(resp_text)
        }
    }

    let [windspeed_sonif, temp_sonif] = await Promise.all([
        loader("/assets/static/legends/windspeed.json"),
        loader("/assets/static/legends/temperature.json")
    ])

    return { windspeed_sonif, temp_sonif }
}

let main_device : AudioDevice | null = null
let worklet_port : MessagePort | null = null
let worklet_ctx : AudioContext | null = null
let worklet_node : AudioWorkletNode | null = null
let worklet_gain : GainNode | null = null

/**
 * 
 * Returns the main AudioDevice by creating it if it's null, otherwise just returning the existing AudioDevice.
 * 
 */
function get_audio_device() : AudioDevice {
    if (main_device == null) {
        main_device = new AudioDevice(0.01, 48000)
        return main_device
    } 
    return main_device
}

// I'm so tired figure out what this does yourself
type pctx_out = {"gain" : GainNode, "node" : AudioWorkletNode, "port" : MessagePort, "ctx" : AudioContext}

/**
 * 
 * Returns the port to the global AudioWorklet object that is active on hover mode.
 * 
 */
async function get_worklet_info() : Promise<pctx_out> {
    if (worklet_port == null || worklet_ctx == null || worklet_node == null || worklet_gain == null) {
        let new_ctx = new AudioContext({"sampleRate" : 48000})
        await new_ctx.audioWorklet.addModule("js/worklet.js")
        let caller = new AudioWorkletNode(new_ctx, "noise-processor")
        let amp = new GainNode(new_ctx, {"gain" : 0.2})
        let quad = new BiquadFilterNode(new_ctx, {
            "type" : "lowpass",
            "frequency" : 400.0,
            "Q" : 0.5
        })
        caller.connect(quad)
        quad.connect(amp)
        amp.connect(new_ctx.destination)
        worklet_port = caller.port
        worklet_ctx = new_ctx
        worklet_node = caller
        return {"gain" : amp, "node": caller, "port" : caller.port, "ctx" : new_ctx}
    }
    return {"gain" : worklet_gain, "node": worklet_node, "port" : worklet_port, "ctx" : worklet_ctx}
}

let legends = await prep_sonification_legend_objects()

/// Determines the state of the webapp.
type C2SAppState = {["current_active_video"] : "windspeed" | "temp", ["current_viewing_mode"] : "video" | "canvas", [ "current_audio_mode"] : "pixel" | "hover", ["current_canvas_context"] : "none" | "temp" | "windspeed", ["current_noise_parameter"] : NoiseParameter}

let AppState : C2SAppState = {
    "current_active_video" : "temp",
    "current_viewing_mode" : "video",
    "current_audio_mode" : "pixel",
    "current_canvas_context" : "none",
    "current_noise_parameter" : NoiseParameter.VOLUME
}

// NOTE: No need to add DOMContentLoaded because the async ops take as long as it takes for the context to load on a good day, failsafe is not something I want to bother with.

const video_mode_button = doc_child("video_mode")! as HTMLButtonElement
const canvas_mode_button = doc_child("canvas_mode")! as HTMLButtonElement
const click_tap_btn = doc_child("click_tap_btn")! as HTMLButtonElement
const hover_btn = doc_child("hover_btn")! as HTMLButtonElement
const windspeed_btn = doc_child("windspeed_btn")! as HTMLButtonElement
const temp_btn = doc_child("temp_btn")! as HTMLButtonElement
const noise_param_btn = doc_child("volume_btn")! as HTMLButtonElement
const pitch_param_btn = doc_child("pitch_btn")! as HTMLButtonElement
const video = doc_child("mapVideo")! as HTMLVideoElement
const volume_slider = doc_child("volume_slider")! as HTMLInputElement
const mapVideoSource = video.querySelector("source")! as HTMLSourceElement

// The next 2 functions are merely for DRY, they don't affect the amount of function protos generated (they purely feed extra arguments via closure)

/**
 * Wires the movement event interaction on a given canvas.
 * @param canvas The canvas to operate on.
 * @param port The MessagePort to use.
 */
function canvas_move_with_port_wire(canvas : HTMLCanvasElement, port : MessagePort, param : NoiseParameter) : void {
    wire_move(canvas, (_ : HTMLElement, x : number, y : number) => {
        print(x, y)
        let as_legend = AppState.current_active_video + "_sonif"
        let t_pixel: Uint8ClampedArray = pixel_on_canvas(canvas, x, y)
        let result = sonify_pixel(t_pixel, legends[as_legend])
        let numeric = result.values[0]!
        // port.postMessage({ "strength": numeric });
        const now = (worklet_ctx as AudioContext).currentTime;
        (worklet_node as AudioWorkletNode).parameters.get("strength")?.exponentialRampToValueAtTime(numeric, now + 0.05)
    })
}

/**
 * Wires the interact event interaction on the given canvas.
 * @param canvas The canvas to operate on.
 */
function canvas_interact_wire(canvas : HTMLCanvasElement, param : NoiseParameter) : void {
    wire_on_interact(canvas, (_ : HTMLElement, x : number, y : number) => {
        print(x, y)
        let device = get_audio_device()
        device.set_playback(false)
        let t_pixel = pixel_on_canvas(canvas, x, y)
        print(`Clicked on pixel with an RGB value of: ${t_pixel}`)
        let as_legend = AppState.current_active_video + "_sonif"
        let result = sonify_pixel(t_pixel, legends[as_legend])
        let numeric = result.values[0]!
        device.numeric_into_buffer(numeric, 1)
        device.set_pitch(2000.0)
        device.set_playback(true)  
    })
}

wire_on_interact(video_mode_button, async () => {
    if (AppState.current_audio_mode == "hover") {
        let obj = await get_worklet_info()
        
        recreate_canvas(video)
        unrecog_css_hack(click_tap_btn, "active", true)
        AppState.current_audio_mode = "pixel"
    }
    unrecog_css_hack(hover_btn, "disabled", true)
    unrecog_css_hack(video_mode_button, "active", true)
    unrecog_css_hack(canvas_mode_button, "active", false)
    if (AppState.current_viewing_mode == "video") { return }
    AppState.current_viewing_mode = "video"
    switch_to_playback_mode(video)
})

wire_on_interact(canvas_mode_button, async () => {
    unrecog_css_hack(hover_btn, "disabled", false)
    unrecog_css_hack(canvas_mode_button, "active", true)
    unrecog_css_hack(video_mode_button, "active", false)
    if (AppState.current_viewing_mode == "canvas") { return }
    let created_canvas = switch_to_canvas_mode(video) as HTMLCanvasElement
    AppState.current_canvas_context = AppState.current_active_video
    if (AppState.current_audio_mode == "hover") {
        let obj = await get_worklet_info() // Setup port (this is why we need async, can't block main thread)
        let worklet_port = obj.port
        canvas_move_with_port_wire(created_canvas, worklet_port, AppState.current_noise_parameter)
    } else {
        canvas_interact_wire(created_canvas, AppState.current_noise_parameter)
    }
    AppState.current_viewing_mode = "canvas"
})

wire_on_interact(click_tap_btn, async () => {
    unrecog_css_hack(click_tap_btn, "active", true)
    unrecog_css_hack(hover_btn, "active", false)
    // HACK: Stinky, stinky hack. Recreate the canvas to avoid having to disconnect an anonymous event listener (this is faster than implementing caching on these pieces of shit)
    if (AppState.current_audio_mode == "hover") { // The above only applies on canvas view of course.
        let new_canvas = recreate_canvas(video)
        let obj = await get_worklet_info()
        let now = obj.ctx.currentTime
        obj.node.parameters.get("strength")?.exponentialRampToValueAtTime(0, now)
        await obj.ctx.suspend()
        AppState.current_audio_mode = "pixel"
        canvas_interact_wire(new_canvas, AppState.current_noise_parameter)
    }
})

wire_on_interact(hover_btn, async () => {
    unrecog_css_hack(click_tap_btn, "active", false)
    unrecog_css_hack(hover_btn, "active", true)
    if (AppState.current_audio_mode == "pixel") {
        let new_canvas = recreate_canvas(video) 
        let obj = await get_worklet_info()
        let port = obj.port
        await obj.ctx.resume()
        AppState.current_audio_mode = "hover"
        canvas_move_with_port_wire(new_canvas, port, AppState.current_noise_parameter)
    }
})

wire_on_interact(windspeed_btn, () => {
    unrecog_css_hack(windspeed_btn, "active", true)
    unrecog_css_hack(temp_btn, "active", false)
    mapVideoSource.src = 'static/videos/MC02_stage3_GMAO_near_surface_wind_2048x1024_en.mp4';
     video.addEventListener("loadeddata", async () => {
        let obj = await get_worklet_info()
        let port = obj.port
        if (AppState.current_viewing_mode == "canvas" && AppState.current_canvas_context != "windspeed") {
            // recreate canvas if we're in canvas mode
            let new_canvas = recreate_canvas(video) as HTMLCanvasElement
            AppState.current_canvas_context = "windspeed"
            switch (AppState.current_audio_mode) {
                case "pixel":
                    canvas_interact_wire(new_canvas, AppState.current_noise_parameter)
                    break
                case "hover":
                    canvas_move_with_port_wire(new_canvas, port, AppState.current_noise_parameter)
                    break
            }
        }
    }, { "once": true })
    video.load()    
    AppState.current_active_video = "windspeed"
})

wire_on_interact(temp_btn, () => {
    unrecog_css_hack(temp_btn, "active", true)
    unrecog_css_hack(windspeed_btn, "active", false)
    mapVideoSource.src = 'static/videos/MC01_stage3_GMAO_near_surface_temperature_2048x1024_en.mp4';
    video.addEventListener("loadeddata", async () => {
        if (AppState.current_viewing_mode == "canvas" && AppState.current_canvas_context != "temp") {
            // recreate canvas if we're in canvas mode
            let new_canvas = recreate_canvas(video) as HTMLCanvasElement
            AppState.current_canvas_context = "temp"
            switch (AppState.current_audio_mode) {
                case "pixel":
                    canvas_interact_wire(new_canvas, AppState.current_noise_parameter)
                    break
                case "hover":
                    let obj = await get_worklet_info()
                    let port = obj.port
                    canvas_move_with_port_wire(new_canvas, port, AppState.current_noise_parameter)
                    break
            }
        }
    }, { "once": true })
    video.load()    
    AppState.current_active_video = "temp"
})


wire_on_interact(noise_param_btn, async () => {
    let new_canvas = recreate_canvas(video) as HTMLCanvasElement

    switch (AppState.current_audio_mode) {
        case "pixel":
            canvas_interact_wire(new_canvas, AppState.current_noise_parameter)
            break
        case "hover":
             let obj = await get_worklet_info()
            let port = obj.port
            canvas_move_with_port_wire(new_canvas, port, AppState.current_noise_parameter)
            break
    }
    AppState.current_noise_parameter = NoiseParameter.VOLUME
})

wire_on_interact(pitch_param_btn, async () => {
    let new_canvas = recreate_canvas(video) as HTMLCanvasElement

    switch (AppState.current_audio_mode) {
        case "pixel":
            canvas_interact_wire(new_canvas, AppState.current_noise_parameter)
            break
        case "hover":
            let obj = await get_worklet_info()
            let port = obj.port
            canvas_move_with_port_wire(new_canvas, port, AppState.current_noise_parameter)
            break
    }
    AppState.current_noise_parameter = NoiseParameter.PITCH
})

async function on_mouse_move(evt : MouseEvent) : Promise<void> {
    let new_gain = parseInt(volume_slider.value) / 100
    let obj = await get_worklet_info()
    let device = get_audio_device()
    obj.gain.gain.setValueAtTime(new_gain, obj.ctx.currentTime)
    device.change_gain(new_gain)
}


volume_slider.addEventListener("mousedown", () => {
    volume_slider.addEventListener("mousemove", on_mouse_move)
})

volume_slider.addEventListener("mouseup", () => {
    volume_slider.removeEventListener("mousemove", on_mouse_move)
})


// TODO: make audioworklet actually sound hearable, make pixel coupling work
