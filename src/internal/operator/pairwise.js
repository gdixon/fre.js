// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will pair the messages into an array of [prev,this]
// - on first message we record the prev and wait for the next message 
// - when we receive the next message we emit to observer and record prev ready for the next message
export const pairwise = function (unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(() => {

        // create a new state object for every subscription
        return {
            count: 0,
            prev: undefined
        };
    }, (observer, message, state) => {
        // ensure both messages are present
        if (state.count > 0) {
            // push projected messages through the map
            observer.next([state.prev, message]);
        }
        // incr to next counter
        state.count++;
        // record the prev message
        state.prev = message;
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // create an observable instance (equal to constructor) to pass the mapped messages to
    return (ctx) => {
        
        // create a subscription on this Observable returning a new Observable
        return publisherFactory(ctx);
    };
};