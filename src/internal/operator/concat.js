// use Observable/concat to create a new observable which combines the source and the target
import { Concat } from "../observable/concat.js";

// on subscribe of response attaches an Observer to this Observable which will output all messages from ctx then 
// each of the targets (in order after completion of the prev)
export const concat = function (targets, unsubscribe) {

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // concat the ctx against the targets for a single instance
        return Concat([ctx, ...targets], unsubscribe);
    };
};
