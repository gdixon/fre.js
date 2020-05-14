// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will output value for every message it receives
export const mapTo = function (value, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, function(observer) { 
            
        // mapTo converts all messages to constant value (we ignore the sent message)
        return observer.next(value);
    }, undefined, undefined, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // call unsubscribe on the observer
        observer.unsubscribe();
    });

    // create an observable instance (equal to constructor) to pass the mapped messages to
    return (ctx) => {
        
        // create a subscription on this Observable to push the projected message
        return publisherFactory(ctx);
    };
};