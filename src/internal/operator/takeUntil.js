// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const takeUntil = function (predicate, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(function () {
        // construct state for every subscription on the pipe
        const state = {}, outer = this;
        // subscribe to the pridicate to alert Operator to complete
        state.notifier = (predicate && predicate.subscribe ? predicate.subscribe(function () {
            // complete the Operator subscription at OuterObserver level
            outer.complete();
            // drop this observer as soon as it emits
            this.unsubscribe();
            // clean up the notifiers presence
            delete state.notifier;
        }, (e) => {
            // push error to the outer
            this.error(e);
        }) : (() => {
            // error now
            this.error("Notifier is not an Observable");
        })());

        // return the state construct (created new for every subscription)
        return state;
    }, (observer, message) => {
        // push messages through to next chained subscriber
        observer.next(message); 
    }, undefined, function(observer) {
        // completed without having to schedule the complete
        observer.complete();
    }, (observer, state) => {
        // drop the notifier
        if (state.notifier) state.notifier.unsubscribe();
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // construct the operator with local context (build notifier once per operation)
        return publisherFactory(ctx);
    };
};