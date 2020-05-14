// map to SwitchMap - wrapping the project in a closure
import { switchMap } from "./switchMap.js";

// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the target Observable (project)
// on each message from the source - project allows us to get result of outer and inner in the same message 
// - projected Observable is unsubscribed with each new message on the source
export const switchMapTo = function (project, selector, unsubscribe) {
    // forward request to switchMap
    const publisherFactory = switchMap(() => project, selector, unsubscribe);

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        return publisherFactory(ctx);
    };
};