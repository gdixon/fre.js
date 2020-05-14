// Merge produces an observable with all emissions
import { Merge } from "./merge.js";
// convert the Observable to an array
import { toArray } from "../operator/toArray.js";

// merges all the targets and calls toArray on the result
export const ForkJoin = function (...targets) {

    // merge the targets and pipe toArray
    return Merge(targets).pipe(toArray());
};