// this module creates Observable instances...
import { Observable } from "../observable.js";

// Concat Observable instances into one stream ([1,...,3] + [1] === [1,...,3,1]) (where ... is a delay)
export const CombineLatest = function (targets, project, options) {

    // create an observable instance (equal to constructor) to pass the all messages from all Observables to
    return new Observable((observer) => {
        // take ref to context as Observable
        const observable = this, latest = {};
        // track state for aysnc actions
        let completed = 0, unsubscribed = 0;
        // collect all messages on all streams (we record all subscriptions so that unsub of all Observers on response Observable unsubs all of these subscriptions)
        targets.forEach((target, key) => {
            // allow for the removal instruction to be set and available async inside the observer (so it can remove itself on completion if completion happens async)
            let remove = null;
            // subscribe on this Observable returning the subscription and forwarding all messages to the outside Observer
            remove = observer.add(target.subscribe(
                // next (defined as function not closure for access to target->subscriber context)
                function(message) {
                    // set the message to the key pos of target into latest
                    latest[key] = message;
                    // only emits when a message is present for all targets
                    if (Object.keys(latest).length === targets.length) {
                        // attempt to schedule the message
                        try {
                            // values in array form
                            const values = Object.keys(latest).map((key) => latest[key]);
                            // serve the message
                            observer.next((project ? project(...values) : values));
                        } catch (err) {
                            // catch and emit any errors
                            this.error(err);
                        }
                    }
                },
                // error
                function(err) {
                    // pass through to the observer
                    observer.error(err);
                },
                // complete
                function() {
                    // mark that we closed
                    completed++;
                    // remove the teardown instruction - no need to clear when already cleared
                    if (remove) remove((remove = false));
                    // stream complete
                    if (!observer._closed && completed === targets.length) {
                        // send complete message
                        observer.complete();
                    }
                },
                // straight up unsubscribe (without each target calling .complete first - this is only really a consideration on hot types that will not complete)
                function() {
                    // mark that we closed
                    unsubscribed++;
                    // remove the teardown instruction - no need to clear when already cleared
                    if (remove) remove((remove = false));
                    // stream complete
                    if (!observer._closed && unsubscribed === targets.length) {
                        // send complete message
                        observer.unsubscribe();
                        // call the unsubscribe method with given observable && observer
                        if (options && options.unsubscribe) options.unsubscribe.call(observable, observer);
                    }
                }
            ));
        });
    });
};
