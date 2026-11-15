/// Some utilities, including redeclaration of function objects and helpers.
/**
 * Redeclaration of console.log().
 * Side effect of this is that everything that is printed will be showed in an array by the interpreter. Since logging is somewhat perf critical on systems, might be bad.
 * @param any A variable amount of objects.
 *
 */
export function print(...any) {
    console.log(...any);
}
/**
 * Redeclaration of document.getElementById().
 * @param child_id The ID of the doc child.
 * @returns The HTMLElement mapped to the given ID or null.
 */
export function doc_child(child_id) {
    return document.getElementById(child_id);
}
/**
 * // HACK: This is a function to write into the className of an HTMLElement
 * @param elm The HTMLElement to operate on.
 * @param property The CSS property to look for.
 * @aparam toggle The boolean that affects whether active will be added or removed. If true, added. If false, removed. If the state is the same, congrats you wasted your time royally.
 */
export function unrecog_css_hack(elm, property, toggle) {
    if (elm.className.endsWith(property) && toggle == false) { // has active
        elm.className = elm.className.slice(0, -(property.length)); // 6 + 1 because of the whitespace that this adds (potentially catastrophic lmfaoo)
    }
    else if (!elm.className.endsWith(property) && toggle == true) {
        elm.className += ` ${property}`;
    }
}
