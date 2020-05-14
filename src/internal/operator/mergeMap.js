// construct an observer against the projected observable to forward messages
import { Subscriber } from "../subscriber.js";
// type check against the projected value to check for Observable type - otherwise just map the value
import { Observable } from "../observable.js";
// base Operator all others should be able to fit into...
import { operator } from "./operator.js";

// on subscribe of response attaches an Observer to the source Observerable (ctx) which will switch to the projected Observable
// with each message from the source allowing for up to n*{concurrency} subscriptions on the projected Observable, if concurrency exceeds concurrent - messages are buffered.  
// (we subscribe a target for each message untill concurrency is met - then we buffer messages to send on completion of any of the subscribed instances)
// - project allows us to use result of outer and inner in the same message by passing the message to a closure to get to the projected Observable
// - projected Observable is unsubscribed on completion 
// - outer Observer is unsubscribed on completion of final projected Observable completion
export const mergeMap = function (project, selector, concurrency, unsubscribe) {
    // default to concurrency of 0 (ie subscribe to all)
    concurrency = (concurrency ? concurrency : 0);
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(
        // set up the mergeMap operators state to handle concurrency and the buffer
        () => {

            // create a new state object for every subscription
            return {
                index: 0,
                concurrent: 0,
                buffer: [],
                subscribed: []
            };
        },
        // for each message received on the source stream, subscribe to projected Observable and merge all received messages onto the Subscriber
        function (observer, message, state) {
            // get outerObserver from context
            const outerObserver = this;
            // process a message or buffer
            function processMessage(message) {
                // track new index from inner
                let innerIndex = 0;
                // while concurrency allows for new entrants...
                if (!concurrency || state.concurrent < concurrency) {
                    // mark that a message is about to be sent
                    state.index++;
                    // incr concurrent count
                    state.concurrent++;
                    // pull the res from the projection or attempt to use the message itself if project is missing
                    const inner = (project instanceof Observable ? project : (typeof project === "function" ? project(message, state.index) : message));
                    // ensure Observable else throw
                    if (!(inner instanceof Observable)) {
                        // throwing if we can't build an Observable from the project 
                        throw ("MergeMap: Project must be supplied as fn which resolves to an Observable");
                    } else {
                        // allow subscription to be known inside observer
                        const subscription = new Subscriber(function (newMessage) {
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
                        }, undefined, () => {
                            // allow for a new inner to open
                            state.concurrent--;
                            // remove the subscription so that its not present when we call outerObserver on complete of mergeMap
                            state.subscribed.splice(state.subscribed.indexOf(subscription), 1);
                            // ensure the prev completed before attempting the next
                            if (subscription.isStopped && !subscription.closed) {
                                // check for messages on the buffer
                                if (state.buffer.length > 0) {
                                    // process the next message from the source Observable (which is buffered)
                                    processMessage(state.buffer.splice(0, 1)[0]);
                                } else if (state.complete) {
                                    // close the outerObserver to hit completion logic (this should be called on every close - only the final close will complete observer)
                                    outerObserver.complete();
                                }
                            }
                        });
                        // subscribe to the res after recording the subscription
                        state.subscribed.push(subscription);
                        // subscribe the map to the target (what if we could subscribe a subscription so that we're not building a new instance?)
                        inner.subscribe(subscription);
                    }
                } else {
                    // queue the message to the buffer for when concurrency falls into range
                    state.buffer.push(message);
                }
            }
            // attempt to prcoess -- allowing the throw to happen inside a message
            try {
                // process every message of the source through processMessage
                processMessage(message);
            } catch (e) {
                // any error should err and complete
                this.error(e);
            }
        },
        // nothing extra to define for error handling
        undefined,
        // dont use the .complete method because we want the unsubscribe actions to propagate on .unsubscribe calls too
        function (observer, state) {
            // mark that the outer finished
            state.complete = true;
            // check that the complete is ready to be scheduled
            if (observer && (observer._error || (state.buffer.length == 0 && state.subscribed.length == 0))) {
                // complete the observer once all in the map have completed
                observer.complete();
            }
        },
        // unsubscribes active inner and completes the observer
        function (observer, state) {
            // drop any inner subscriptions that are left present
            if (state.subscribed.length > 0) {
                // subscribed holds array of active inner subscriptions
                state.subscribed.forEach((subscription) => subscription.unsubscribe());
            }
            // when unsubscribe method is provided call to that to close of any lingering connections
            if (unsubscribe) unsubscribe.call(this);
            // drop the observers subscription and call method
            observer.unsubscribe();
        }
    );

    // pipe should create a new observable for the execution of piped method
    return (ctx) => {

        // create a subscription on this Observable returning a new Observable or do we want to return the same Observable we fed in and let mergeMap feed to the original?
        return publisherFactory(ctx);
    };
};