// use SwitchMap inorder to complete the switchAll routine (switchAll is a switchMap that switches over an Observable-Observable)
import { switchMap } from "./switchMap.js";

// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the target Observable (project)
// on each message from the source - project allows us to get result of outer and inner in the same message 
// - projected Observable is unsubscribed with each new message on the source
export const switchAll = function (selector, unsubscribe) {
    // use switchMap to carryout the work - passing undefined as selector forces switchMap to use Message as projected Observable
    const publisherFactory = switchMap(undefined, selector, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable or do we want to return the same Observable we fed in and let mergeMap feed to the original?
        return publisherFactory(ctx);
    };
};