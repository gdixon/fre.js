// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will take n number of messages
// and pass them to a new stream
export const take = function (take, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(function () {
        // if the take is empty then immediately unsubscribe
        if (!take || typeof take !== "number") this.error("Take must be int");

        // return an object to record the number of taken mesages
        return {
            taken: 0
        };
    }, function (observer, message, state) {
        // record the message
        state.taken = state.taken+1;
        // push projected messages through the map
        observer.next(message);
        // take for the number of takes
        if (state.taken == take) {
            // think we're complete after emmiting one?
            this.complete();
        }
    }, undefined, function (observer) {
        // complete on takes musts return undefined to call local Unsubscribe even if later Operators forgo the unsubscribe
        observer.complete();
    }, function(observer)  {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // create an observable instance (equal to constructor) to pass the mapped messages to
    return (ctx) => {
        
        // create a new Operator for each invoke to hold local operation state
        return publisherFactory(ctx);
    };
};