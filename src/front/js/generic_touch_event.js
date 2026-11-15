/**
 *
 * Wires both a MouseEvent::mouse_move and a TouchEvent::touch_move for the HTMLElement.
 * Only the first touch movement on touches will be considered.
 * @param elm The HTML element to add the listener to.
 * @param clbk The callback to execute with the current positions provided by the events.
 */
export function wire_move(elm, clbk) {
    elm.addEventListener("mousemove", (evt) => {
        clbk(elm, evt.clientX, evt.clientY);
    });
    elm.addEventListener("touchmove", (evt) => {
        let considered_touch = evt.targetTouches[0];
        clbk(elm, considered_touch.clientX, considered_touch.clientY);
    });
}
/**
 *
 * Wires both a MouseEvent::mouseclick and a TouchEvent::touchstart for the HTMLElement
 * Only the first touch on touches will be considered.
 * @param elm The HTML element to add the listener to.
 * @param clbk The callback to execute with the current positions provided by the elements.
 *
 */
export function wire_on_interact(elm, clbk) {
    elm.addEventListener("click", (evt) => {
        clbk(elm, evt.clientX, evt.clientY);
    });
    elm.addEventListener("touchstart", (evt) => {
        let considered_touch = evt.targetTouches[0];
        clbk(elm, considered_touch.clientX, considered_touch.clientY);
    });
}
