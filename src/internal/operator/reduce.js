// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will reduce the data value
// according to project and forward final message to new Observable instances Observers
export const reduce = function (project, initialValue, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {

        // create a new state object for every subscription
        return {
            value: initialValue || 0
        };
    }, (observer, message, state) => {
        try {
            state.value = project(state.value, message);
        } catch (e) {
            observer.error(e);
        }
    }, undefined, (observer, state) => {
        // return the reduced value on complete
        observer.next(state.value);
        // call to complete (which will unsubscribe)
        observer.complete();
    }, (observer) => {
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