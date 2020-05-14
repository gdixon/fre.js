// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const skipUntil = function (predicate, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(function() {
        // construct state for every subscription on the pipe
        const state = {};
        // marked as started when message received from predicate
        state.started = false;
        // subscribe to the pridate to alert Operator of start
        state.notifier = (predicate && predicate.subscribe ? predicate.subscribe(() => {
            // mark as started (emitted messages are now allowed through)
            state.started = true;
        }) : (() => {
            // push through error at outerObserver level
            this.error("Notifier is not an Observable");
        })());

        // return the state construct (created new for every subscription)
        return state;
    }, (observer, message, state) => {
        // push projected messages through the map
        if (state.started) observer.next(message); 
    }, undefined, undefined, (observer, state) => {
        // drop the notifier
        if (state.notifier && state.notifier.unsubscribe) state.notifier.unsubscribe();
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // produce an Operator which begins when predicate emits a message
        return publisherFactory(ctx);
    };
};