// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const last = function (predicate, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {

        // create a new state object for every subscription
        return {
            last: undefined
        };
    }, (...args) => {
        // destructure state from arguments
        const [, message, state] = args;
        // last message that matches the predicate
        if (!predicate || predicate(message)) state.last = message;
    }, undefined, (observer, state) => {
        // always send message on completion
        observer.next(state.last);
        // complete the observer
        observer.complete();
    }, (observer) => {
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