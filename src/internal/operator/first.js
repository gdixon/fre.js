// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will output the first message it receives and complete
export const first = function (predicate, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, function (observer, message) {
        // send the first message which matches predicate
        if (!observer._closed && (!predicate || predicate(message))) {
            // pass to the observer
            observer.next(message);
            // complete from here after sending first message
            this.complete();
        } 
    }, undefined, (observer) => {
        // complete the observer
        return observer.complete();
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