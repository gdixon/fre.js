// This operator proxies the request via MergeMap - passing concurrency of 1
import { mergeMap } from "./mergeMap.js";

// MergeAll is a mergeMap which doesnt provide a project or a selector - all projecting is based on the messages
// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable (message)
// allowing for up to n*{concurrency} instances of the projected Observables, if concurrency exceeds concurrent - messages are buffered.  
// (we subscribe a target for each message untill concurrency is met - then we buffer messages to send on completion of any of the subscribed instances)
// - message Observable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of final projected Observable completion
export const mergeAll = function (concurrency, unsubscribe) {
    // forward request to MergeMap with a concurrency of 1
    const publisherFactory = mergeMap(undefined, undefined, concurrency, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // pass the pipe vars through to mergeMap instance
        return publisherFactory(ctx);
    };
};