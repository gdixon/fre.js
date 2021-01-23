// this module creates Observable instances...
import { Observable } from "../observable.js";
// const FromArray = require("./fromArray.js");
import { FromArray } from "./fromArray.js";
// const FromPromise = require("./fromPromise.js");
import { FromPromise } from "./fromPromise.js";
// const FromObservable = require("./fromObservable.js");
import { FromObservable } from "./fromObservable.js";
// const FromArray = require("./fromArray.js");
import { FromIterable } from "./fromIterable";
// const FromArray = require("./fromArray.js");
import { FromAsyncIterable } from "./fromAsyncIterable.js";

// static method to create a new Observable from an Array of values to be emitted
export const From = function (input, scheduler, options) {
    // return fromable types (Promise, Observable, Iterable, AsyncIterable, Objects/Arrays and Strings) - callbacks and events are handled seperately
    if (typeof input.length === "number" && typeof input !== "function") {

        return FromArray(input, scheduler, options);
    } else if (input instanceof Promise) {
        
        return FromPromise(input, scheduler, options);
    } else if (typeof input[(typeof Symbol === "function" && Symbol.observable) || "@@observable"] === "function") {

        return FromObservable(input, scheduler, options);
    } else if ((typeof input == "object" && Symbol.iterator in Object(input)) || typeof input == "string") {

        return FromIterable(input, scheduler, options);
    } else if (typeof input == "object" && Symbol.asyncIterator in Object(input)) {

        return FromAsyncIterable(input, scheduler, options);
    }

    // throw (via Observable) if we cant match type
    return new Observable(() => { throw ((input !== null && typeof input) + " is not observable"); });
};
