// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const takeWhile = function (predicate, unsubscribe) {
    // this combines skipWhile and takeWhile to one Operator without impacting the usecases of takeWhile?
    const publisherFactory = operator(undefined, function (observer, message) {
        // check if the predicate is matched by the message
        const complete = !predicate(message);
        // once we start receiving messages we can complete a failed sendMessage state
        // state.stopped = (state.stopped ? state.stopped : !sendMessage);
        // when valid send the message
        if (!complete) observer.next(message);
        // else complete the stream (from this)
        else this.complete();
    }, undefined, function (observer) {
        // completed without having to schedule the complete
        observer.complete();
    }, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // create a new instance to hold state for each execution
        return publisherFactory(ctx);
    };
};