// construct an Observable that emits each target
import { FromArray } from "./fromArray.js";
// use SwitchMap with empty selector and projector -- will use the Message Observable for each switch
import { switchAll } from "../operator/switchAll.js";

// switch Observable instances into one stream (streams each message as it is ready - can be used with Subject types)
export const Switch = function (targets, unsubscribe) {
    
    // create an observable instance to pass all messages from all Observables to
    return FromArray(targets).pipe(switchAll(unsubscribe));
};
