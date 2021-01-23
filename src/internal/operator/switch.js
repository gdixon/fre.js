// use Observable/switch to create a new observable which combines the source and the target
import { Switch } from "../observable/switch.js";

// should I make merge and concat mergeWith and concatWith or mergeStream, concatStream, switchStream -- that implies it accepts streams as trargets 

// on subscribe of response attaches an Observer to this Observable which will output all messages from ctx and targets as they arrive
export const switchWith = function (targets, unsubscribe) {

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // switch the ctx against the targets for a single instance returning an Observable
        return Switch([ctx, ...targets], unsubscribe);
    };
};