// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will filter the data value
// according to project and forward new message to new Observable instances Observers
export const filter = function (project, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, function (observer, message) {

        // only forward the message if it passes project
        if (project(message)) observer.next(message);
    }, undefined, undefined, (observer) => {
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