// use Observable/merge to create a new observable which combines the source and the target
import { Merge } from "../observable/merge.js";

// on subscribe of response attaches an Observer to this Observable which will output all messages from ctx and targets as they arrive
export const merge = function (targets, concurrent, unsubscribe) {

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // merge the ctx against the targets for a single instance returning an Observable
        return Merge([ctx, ...targets], concurrent, unsubscribe);
    };
};