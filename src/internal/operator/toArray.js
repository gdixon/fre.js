// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will filter the data value
// according to project and forward new message to new Observable instances Observers
export const toArray = function (unsubscribe) {
    // toArrays operator state is held within, so we can set operator once outside of ctx
    const publisherFactory = operator([], (...args) => {
        // destructure state from arguments
        const [, message, state] = args;
        // record all messages until complete
        state.push(message);
    }, undefined, function (observer, state) {
        // next on the observers with the full array
        observer.next(state);
        // complete after passing toArray
        observer.complete();
    }, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe && typeof unsubscribe == "function") unsubscribe();
        // unsubscribes if !this.closed or closing === true
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // create a subscription on ctx Observable (note that were using the ObservableLike builder for all builds here... (by forcing with true))
        return publisherFactory(ctx);
    };
};