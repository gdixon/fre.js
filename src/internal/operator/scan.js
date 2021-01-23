// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will scan the data value
// according to project and forward each message to new Observable instances Observers
export const scan = function (project, initialValue, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {

        // create a new state object for every subscription
        return {
            value: initialValue || 0
        };
    }, (observer, message, state) => {
        try {
            // apply the projection to the value and accumulate - nexting each time
            observer.next(state.value = project(state.value, message));
        } catch (e) {
            observer.error(e);
        }
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable
        return publisherFactory(ctx);
    };
};