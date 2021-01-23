// by default the groups should be loaded into a Subject
import { Subject } from "../subject.js";
// base Operator all others should be able to fit into...
import { operator } from "./operator.js";
// when durationSelector is present we should complete the groups Subject on first message from durationObserverable
import { takeUntil } from "./takeUntil.js";

// boundaries: [ <lowerbound1>, <lowerbound2>, ... ],
// defaultBoundary: any,
// - An array of [ 0, 5, 10 ] creates two buckets:
//  - [0, 5) with inclusive lower bound 0 and exclusive upper bound 5.
//  - [5, 10) with inclusive lower bound 5 and exclusive upper bound 10.
//  - if a defaultBoundary is supplied then any message which dont match the boundary will be forwarded here instead

// on subscribe of response attaches an Observer to this Observable which will filter the data value
// according to project and forward new message to new Observable instances Observers
export const bucket = function (boundaries, defaultBoundary, keySelector, elementSelector, durationSelector, subjectSelector, unsubscribe) {
    // define the operation once regardless of how many times this operator is called
    const publisherFactory = operator(
        // set up the operations state (per invoke)
        function () {

            return {
                buckets: {}
            };
        }, function (observer, message, state) {
            // produce the groups key
            const key = keySelector(message);
            // assign the boundary according to the boundaries set
            let boundary = null, pointer = 0;
            // discover the correct boundary to place the values
            while (boundary === null && pointer < boundaries.length - 1) {
                // check where the key falls in the given boundary set
                if (key >= boundaries[pointer] && key <= boundaries[pointer + 1]) boundary = boundaries[pointer];
                // check the next pointer if we havent discovered a boundary yet
                if (boundary === null) pointer++;
            }
            // describes the final position of the bucket
            const bucket = (boundary !== null ? { lower: boundaries[pointer], upper: boundaries[pointer + 1] } : { default: defaultBoundary });
            // default the boundary if default is available (this catches all messages which fall outside of a bucket boundary)
            boundary = (boundary !== null ? boundary : defaultBoundary);
            // any messages that dont fall into a bucket (or the defaultBoundary) are dropped
            if (boundary !== null && typeof boundary !== "undefined") {
                // make sure we cast entities
                if (!state.buckets[boundary]) {
                    // create the base subject to emit against
                    const subject = (!subjectSelector ? new Subject() : (subjectSelector.subscribe && subjectSelector.next ? subjectSelector : subjectSelector(bucket)));
                    // create a new subject for each group taking into account the durationSelector (takeUntil the durationSelector emits)
                    state.buckets[boundary] = (!durationSelector ? subject : subject.pipe(takeUntil(durationSelector(subject))));
                    // emit the subject to the observer (operator creates an Observable-Observable)
                    observer.next(state.buckets[boundary]);
                }
                // forward the message
                state.buckets[boundary].next((elementSelector ? elementSelector(message, bucket) : message));
            }
        }, undefined, (observer, state) => {
            // complete the bucketed subjects (in boundary order - this allows use to mergeMap into an single collection ordered by boundary group)
            Object.keys(state.buckets).forEach((subject) => state.buckets[subject].complete());
            
            // complete the outer observer
            return observer.complete();
        }, (observer, state) => {
            // complete the subjects
            Object.keys(state.buckets).forEach((subject) => state.buckets[subject].unsubscribe());
            // unsubscribe the new observer
            if (unsubscribe) unsubscribe();
            // call unsubscribe on the observer
            observer.unsubscribe();
        }
    );

    // pipe will take the retuned publisher and wrap it with the _lift definition on the source ctx returning a lifted instance (Observable or Subject)
    return (ctx) => {

        // create a publisher which subscribes to ctx and performs the work as defined
        return publisherFactory(ctx);
    };
};