// by default the groups should be loaded into a Subject
import { Subject } from "../subject.js";
// base Operator all others should be able to fit into...
import { operator } from "./operator.js";
// when durationSelector is present we should complete the groups Subject on first message from durationObserverable
import { takeUntil } from "./takeUntil.js";

// on subscribe of response attaches an Observer to this Observable which will filter the data value
// according to project and forward new message to new Observable instances Observers
export const groupBy = function (keySelector, elementSelector, durationSelector, subjectSelector, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(
        // construct this operations state (called new for each invoc of the pipe (each subscription))
        function () {

            return {
                order: [],
                groups: {}
            };
        }, function (observer, message, state) {
            // produce the groups key
            const group = keySelector(message);
            // make sure we cast entities
            if (!observer.closed && message && group) {
                // check if the group needs to be created
                if (!state.groups[group]) {
                    // create the base subject to emit against
                    const subject = (!subjectSelector ? new Subject() : (subjectSelector.subscribe && subjectSelector.next ? subjectSelector : subjectSelector(group)));
                    // push the group so we can complete in provided order
                    state.order.push(group);
                    // create a new subject for each group taking into account the durationSelector (takeUntil the durationSelector emits)
                    state.groups[group] = (!durationSelector ? subject : subject.pipe(takeUntil(durationSelector(subject))));
                    // emit the subject to the observer (operator creates an Observable-Observable)
                    observer.next(state.groups[group]);
                }
                // forward the message
                state.groups[group].next((elementSelector ? elementSelector(message, group) : message));
            }

        }, undefined, (observer, state) => {
            // complete the subjects
            state.order.forEach((subject) => state.groups[subject].complete());
            
            // complete the outer observer
            return observer.complete();
        }, (observer, state) => {
            // complete the subjects
            state.order.forEach((subject) => state.groups[subject].unsubscribe());
            // unsubscribe the new observer
            if (unsubscribe) unsubscribe();
            // call unsubscribe on the observer
            observer.unsubscribe();
        }
    );

    // pipe should create a new observable for the execution of piped method?
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable
        return publisherFactory(ctx);
    };
};