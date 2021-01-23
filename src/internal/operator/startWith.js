// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const startWith = function (...args) {
    // unsubscribe is last argument supplied (if its a function)
    let unsubscribe = false;
    // splice final argument for unsubscribe (only if is a function)
    if (args && typeof args[args.length-1] == "function") {
        // remove from args and set at as unsubscribe
        unsubscribe = args.splice(args.length-1, 1)[0];
    }
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, (observer, message) => {
        // on first message to observer emits the startWith messages
        if (observer && !observer._started) {
            // dont do this again
            observer._started = true;
            // apply everything fed in as an item at the start of a new Observable
            args.forEach((item) => {
                // push all items provided here onto the Observer stream
                observer.next(item);
            });
        }
        // push projected messages through the map
        observer.next(message);
    }, undefined, undefined, function(observer) {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable
        return publisherFactory(ctx);
    };
};