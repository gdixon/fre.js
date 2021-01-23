// This operator proxies the request via MergeMap - passing concurrency of 1
import { mergeMap } from "./mergeMap.js";

// ConcatAll is a mergeMap which doesnt provide a project or a selector and has a concurrency of 1 - all projecting is based on the messages
// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable (message)
// any messages arriving on source while the current projected Observable is open will be buffered and a subscription to 
// the projected Observable will be made when the current subscription completes
// - rather than using project - concatAll will attempt to use the message as an Observable
// - projected Observerable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of the final projected Observable (no more messages in buffer)
export const concatAll = function (unsubscribe) {
    // forward request to MergeMap with a concurrency of 1
    const publisherFactory = mergeMap(undefined, undefined, 1, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // pass the pipe vars through to mergeMap instance
        return publisherFactory(ctx);
    };
};