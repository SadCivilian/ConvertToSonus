export type GenericInputEventClbk = (elm : HTMLElement, x : number, y : number) => void

/**
 * 
 * Wires both a MouseEvent::mouse_move and a TouchEvent::touch_move for the HTMLElement.
 * Only the first touch movement on touches will be considered.
 * @param elm The HTML element to add the listener to.
 * @param clbk The callback to execute with the current positions provided by the events. 
 */
export function wire_move(elm : HTMLElement, clbk : GenericInputEventClbk) : void {
    elm.addEventListener("mousemove", (evt : MouseEvent) => {
        clbk(elm, evt.clientX, evt.clientY)
    })

    elm.addEventListener("touchmove", (evt : TouchEvent) => {
        let considered_touch = evt.targetTouches[0]!
        clbk(elm, considered_touch.clientX, considered_touch.clientY)
    })
}

/**
 * 
 * Wires both a MouseEvent::mouseclick and a TouchEvent::touchstart for the HTMLElement
 * Only the first touch on touches will be considered. 
 * @param elm The HTML element to add the listener to.
 * @param clbk The callback to execute with the current positions provided by the elements.
 * 
 */
export function wire_on_interact(elm : HTMLElement, clbk : GenericInputEventClbk) : void {
    elm.addEventListener("click", (evt : MouseEvent) => {
        clbk(elm, evt.clientX, evt.clientY)
    })  

    elm.addEventListener("touchstart", (evt : TouchEvent) => {
        let considered_touch = evt.targetTouches[0]!
        clbk(elm, considered_touch.clientX, considered_touch.clientY)
    })
}




