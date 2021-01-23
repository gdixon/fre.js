// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will reduce the data value
// according to project and forward final message to new Observable instances Observers
export const skip = function (skip, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {
            
        // construct state for every subscription on the pipe
        return {
            skipped: 0
        };
    }, (observer, message, state) => {
        // when skipped is less that the number we're skipping
        if (state.skipped >= skip) {
            observer.next(message);
        } else {
            // up the skips
            state.skipped++;
        }
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // produce an Operator which begins after completing the requested skips
        return publisherFactory(ctx);
    };
};