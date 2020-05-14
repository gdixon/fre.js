// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will tap the data value
// according to tap and forward message to new Observable instances Observers unaltered
export const tap = function (predicate, unsubscribe) {
    // tap operator holds no state so we can share operator between peers
    const publisherFactory = operator(undefined, (observer, message) => {
        // carry out the tap
        if (predicate) predicate(message);
        // forward on the message unaltered
        observer.next(message);
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // create an observable instance (equal to constructor) to pass the mapped messages to
    return (ctx) => {
        
        // create a subscription on this Observable to push the projected message
        return publisherFactory(ctx);
    };
};