// This operator proxies the request via MergeMap - passing concurrency of 1
import { mergeMap } from "./mergeMap.js";

// ConcatMap is equivalent to a mergeMap with concurrency of 1
// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable (project)
// forwarding the message, any messages arriving on source while the projected Observable is open will be buffered and a subscription to 
// the projected Observable will be made when the current subscription completes
// - project allows us to get result of outer and inner in the same message 
// - projected Observerable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of the final projected Observable (no more messages in buffer)
export const concatMap = function (project, selector, unsubscribe) {
    // forward request to MergeMap with a concurrency of 1
    const publisherFactory = mergeMap(project, selector, 1, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // pass the pipe vars through to mergeMap instance
        return publisherFactory(ctx);
    };
};