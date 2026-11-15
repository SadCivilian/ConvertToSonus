// Video frame extractor module for acquiring frame and color data from video tags, and manipulating video playback.
// This took a lot of HTML magic I didn't know about... I'm a backend dev, not an errand boy
// Plus the TS "recommended" module system is gross. How do people enjoy that

import { print, doc_child } from "../js/utils.js"

/**
 * Overlays a HTMLElement on another HTMLElement.
 * @param target The HTMLElement to overlay the other element on.
 * @param layed The HTMLElement that is being overlayed.
 */
function overlay_element(target : HTMLElement, layed : HTMLElement) : void {
  layed.style.position = "absolute"
  layed.style.top = target.style.top
  layed.style.bottom = target.style.bottom
  layed.style.right = target.style.right
  layed.style.left = target.style.left
}

/**
  * 
  *  Extracts a color from pixel position (x,y) in the given canvas. 
  *  @param canvas The canvas to operate on.
  *  @param x X coordinate of pixel.
  *  @param y Y coordinate of pixel.
*/
export function pixel_on_canvas(canvas : HTMLCanvasElement, x : number, y : number) : Uint8ClampedArray {
    return canvas.getContext("2d")!.getImageData(x,y, 1,1).data
}

/**
 * 
 * @param canvas The canvas to operate on.
 * @param x The X coordinate to base the square's "middle point" on (if the size parameter is even, this will be false)
 * @param y The Y coordinate to base the square's "middle point" on (if the size parameter is even, this will be false)
 * @param size The size of the pixel chunk
 * @returns An array of RGBA data.
 */
export function pixel_chunk_on_canvas(canvas : HTMLCanvasElement, x : number, y : number, size : number) : Uint8ClampedArray {
    let draw_ctx = canvas.getContext("2d")!
    let tr = Math.max(0, x-1)
    let ty = Math.max(0, y-1)
    return draw_ctx.getImageData(tr, ty, size, size).data
}

/**
  * 
  *  Extracts a color from pixel position (x,y) in the current video frame of **video**.
  *  @param video The video to operate on.
  *  @param x X coordinate of pixel.
  *  @param y Y coordinate of pixel.
  *  @returns An array of RGBA data.
  *  @deprecated Sunsetted, no use for this func anymore, but good to keep around.
*/
export function pixel_at_current_frame(video : HTMLVideoElement, x : number, y : number) : Uint8ClampedArray {
    let new_canvas = document.createElement("canvas")
    new_canvas.height = video.videoHeight
    new_canvas.width = video.videoWidth
    let draw_ctx = new_canvas.getContext("2d")!
    draw_ctx.drawImage(video, x, y)
    return draw_ctx.getImageData(x, y, 1, 1).data
}

/**
 * 
 * Writes the current frame of the video on a canvas over the video and pauses the video. 
 * @param video The video to canvas-ize. 
 * @returns A reference to the created
*/
export function switch_to_canvas_mode(video : HTMLVideoElement) : HTMLCanvasElement {
    video.pause() // Pause the video first to make it not finnicky
    let new_canvas = document.createElement("canvas")
    new_canvas.style.height = "auto"
    new_canvas.style.width = "100%"
    new_canvas.width = video.videoWidth
    new_canvas.height = video.videoHeight
    new_canvas.id = "CanvasModeCanvas"
    let draw_ctx = new_canvas.getContext("2d")!
    // HACK: temporarily disable controls to make the canvas not inherit them
    // An AI wouldn't make a hack? Right? I'm a human I swear
    video.controls = false
    draw_ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    video.pause()
    video.style.pointerEvents = "none" // Disable all pointer events on the video.
    overlay_element(video, new_canvas)
    video.insertAdjacentElement("beforebegin", new_canvas);
    return new_canvas
}

/**
 * 
 * Removes the current canvas over the video and plays the video. 
 * @param video The video to canvas-ize. 
 * 
*/
export function switch_to_playback_mode(video : HTMLVideoElement) : void {
    // Reenable the stuff of the video first so that removing the canvas is the final slate
    video.controls = true
    video.style.pointerEvents = "auto"
    let canvas = doc_child("CanvasModeCanvas") as HTMLCanvasElement | null // this is always the child that we're looking for
    if (canvas != null) { canvas.remove() }
}

/**
 * 
 * Recreates a canvas by destroying it and cloning it. This is for disconnecting the anonymous event listeners on the canvas. // HACK: can be done more efficiently, don't give a shit
 * @param video The video to operate on.
 * @returns The new canvas element.
 */
export function recreate_canvas(video : HTMLVideoElement) : HTMLCanvasElement {
    let to_delete  = doc_child("CanvasModeCanvas") as HTMLCanvasElement | null // this is always the child that we're looking for
    if (to_delete != null) { to_delete.remove() }
    let canvas = switch_to_canvas_mode(video)
    return canvas
}

