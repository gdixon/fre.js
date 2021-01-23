// construct an Observable that emits each target
import { FromArray } from "./fromArray.js";
// use MergeMap with empty selector and projector -- will use the Message Observable for each merge
import { concatAll } from "../operator/concatAll.js";

// concat Observable instances into one stream (when one stream finishes start the next (mergeMap with a concurrency of 1))
export const Concat = function (targets, unsubscribe) {

    // create an observable instance to pass all messages from all Observables to
    return FromArray(targets).pipe(concatAll(unsubscribe));
};
