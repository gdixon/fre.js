// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to this Observable which will map the data value
// according to project and forward new message to new Observable instances Observers
export const map = function (project, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, function(observer, message) { 
            
        return observer.next(project(message));
    }, undefined, function(observer) {
        // halt parent unsub (handled by child to match order)
        observer.complete();
    }, (observer) => {
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