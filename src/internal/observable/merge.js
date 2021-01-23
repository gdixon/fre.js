// construct an Observable that emits each target
import { FromArray } from "./fromArray.js";
// use MergeMap with empty selector and projector -- will use the Message Observable for each merge
import { mergeAll } from "../operator/mergeAll.js";

// merge Observable instances into one stream (streams each message as it is ready - can be used with Subject types)
export const Merge = function (targets, concurrent, unsubscribe) {
    
    // create an observable instance to pass all messages from all Observables to
    return FromArray(targets).pipe(mergeAll((concurrent || undefined), unsubscribe));
};
