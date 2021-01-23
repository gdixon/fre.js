// This operator proxies the request via MergeMapTo - passing concurrency of 1
import { mergeMapTo } from "./mergeMapTo.js";

// ConcatMapTo is equivalent to a mergeMapTo with concurrency of 1
// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable (project)
// forwarding the message, any messages arriving on source while the projected Observable is open will be buffered and a subscription to 
// the projected Observable will be made when the current subscription completes
// - project is a fully prepared Observable (it will not see the source message)
// - projected Observerable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of the final projected Observable (no more messages in buffer)
export const concatMapTo = function (project, selector, unsubscribe) {
    // forward request to MergeMapTo with a concurrency of 1
    const publisherFactory = mergeMapTo(project, selector, 1, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // pass the pipe vars through to mergeMapTo instance
        return publisherFactory(ctx);
    };
};