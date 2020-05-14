// This operator proxies the request via MergeMap - wrapping the project in a closure to satisfy mergeMap checks
// const MergeMap = require("./mergeMap.js")
import { mergeMap } from "./mergeMap.js";

// MergeMapTo is equivalent to a mergeMap but project is an Observable instance instead of fn returning an Observable instance
// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable
// with each message from the source allowing up to n*{concurrency} subscriptions on the projected Observable 
// (we subscribe a target for each message untill concurrency is met - then we buffer messages to send on completion of any the subscribed instances)
// - project is a fully prepared Observable (it will not see the source message)
// - projected Observable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of the final projected Observable (no more messages in buffer)
export const mergeMapTo = function (project, selector, concurrency, unsubscribe) {
    // forward request to MergeMap wrapping project in closure
    const publisherFactory = mergeMap(() => project, selector, concurrency, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {
        
        // pass the pipe vars through to mergeMap instance
        return publisherFactory(ctx);
    };
};