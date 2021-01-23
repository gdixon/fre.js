// this module creates Observable instances...
import { Observable } from "../observable.js";

export const FromEvent = function (element, type, selector) {

    return new Observable((observer) => {
        // add the listerner
        const listener = (message) => {
            observer.next(selector ? selector(message) : message);
        };
        // add to the element
        element.addEventListener(type, listener);
        // remove on teardown
        observer.add(() => {
            element.removeEventListener(type, listener);
        });
    });
};

// module.exports = FromEvent;