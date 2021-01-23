// wrap the Mapping operation via the Operator (to instrument ctx)
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the target Observable (project)
// on each message from the source - project allows us to get result of outer and inner in the same message 
// - projected Observable is unsubscribed with each new message on the source
export const switchMap = function (project, selector, unsubscribe) {
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(
        // construct new state each invoc
        () => {

            // create a new state object for every subscription
            return {
                // track position of the outer message
                index: 0,
                // record the subscription so that we can end each inner on a new message from source
                subscribed: undefined
            };
        }, function (observer, message, state) {
            // mark that a message is about to be sent
            state.index++;
            // record the outerObservr context for complete calls
            const outerObserver = this;
            // pull the res from the projection
            const inner = (project && project.subscribe ? project : (typeof project === "function" ? project(message, state.index) : message));
            // drop old inner subscription
            if (state.subscribed && state.subscribed.unsubscribe) {
                // clear the subscription
                state.subscribed.unsubscribe();
            }
            // check that res is an Observable(like)
            if (!(inner && inner.subscribe)) {
                // throwing if we can't build an Observable from the project 
                throw ("SwitchMap: Project must be supplied as fn which resolves to an Observable");
            } else {
                // track new index from inner
                let innerIndex = 0;
                // marking a new subscription to inner
                state.innerComplete = false;
                // subscribe to the res and proxy messages through the selector with old and new values
                state.subscribed = inner.subscribe(function (newMessage) {
                    // mark that we're taking a message from the inner
                    innerIndex++;
                    // push the inner message to the observer
                    try {
                        // when selector is provided - project the message
                        observer.next((!selector ? newMessage : selector(message, newMessage, state.index - 1, innerIndex - 1)));
                    } catch (e) {
                        // push any errors through the outerObserver
                        outerObserver.error(e);
                    }
                }, (err) => {
                    // mark the errors to the observer
                    outerObserver.error(err);
                }, () => {
                    // noop the complete from the inner - dont pass to observer - we only care about completes on the outer
                    state.innerComplete = true;
                    // when both are in complete state
                    if (state.complete) {
                        // complete the observer
                        outerObserver.complete();
                    }
                }, () => {
                    // noop the subscribed on unsubscribe
                    state.subscribed = null;
                    // drop observer when both complete
                    if (state.unsubscribed) {
                        // completed without having to schedule the complete
                        outerObserver.unsubscribe();
                    }
                });

            }
        },
        // no error method to attach
        undefined,
        // dont use the .complete method because we want the unsubscribe actions to propagate on .unsubscribe calls too
        function (observer, state) {
            // mark as completed (wait for final subscriber to complete)
            state.complete = true;
            // when both are in complete state
            if (observer && (observer._error || !state.subscribed || state.innerComplete)) {
                // complete the observer once all in the map have completed
                observer.complete();
            }
        },
        // unsubscribes active inner and completes the observer
        (observer, state) => {
            // mark as unsubscribed (wait for final subscriber to unsubscribe before unsubscribing observer)
            state.unsubscribed = true;
            // drop observer if outer completes and subscribed is present?
            if (state.subscribed && state.subscribed.unsubscribe) state.subscribed.unsubscribe();
            // call provided unsubscribe method
            if (unsubscribe) unsubscribe();
            // completed without having to schedule the complete
            observer.unsubscribe();
        }
    );

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable or do we want to return the same Observable we fed in and let mergeMap feed to the original?
        return publisherFactory(ctx);
    };
};