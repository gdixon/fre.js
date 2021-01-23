// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const skipWhile = function (predicate, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {

        // create a new state object for every subscription
        return {
            started: false
        };
    }, (observer, message, state) => {
        // push projected messages through the map
        if (state.started || (!state.started && typeof message !== "undefined" && !predicate(message) && (state.started = true))) observer.next(message); 
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {
        
        // produce an Operator which begins when predicate returns true (checked against every message until pass)
        return publisherFactory(ctx);
    };
};