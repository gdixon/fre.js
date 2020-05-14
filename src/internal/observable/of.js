// convert the given targets to an array and produce an Observable
import { FromArray } from "./fromArray.js";

// static method to create a new Observable from an Array of values to be emitted
export const Of = function(...array) {

    // straight pass through to the constructor
    return FromArray(array);
};
