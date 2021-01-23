// this module creates Observable instances...
import { Observable } from "../observable.js";

// Zip Observable instances into one stream ([1,2,3] + [4,5,6] === [[1,4], [2,5], [3,6]])
export const Zip = function (targets, project, options) {

    // create an observable instance (equal to constructor) to pass the all messages from all Observables to
    return new Observable((observer) => {
        // take ref to context as Observable
        const observable = this, zipped = [];
        // track state for aysnc actions
        let completed = 0, unsubscribed = 0;
        // collect all messages on all streams (we record all subscriptions so that unsub of all Observers on response Observable unsubs all of these subscriptions)
        targets.forEach((target, key) => {
            // internal counter to position the received messages
            let counter = 0;
            // allow for the removal instruction to be set and available async inside the observer (so it can remove itself on completion)
            let remove = null;
            // subscribe on this Observable returning the subscription to be added to the observer which forward appropriately zipped messages to observer
            remove = observer.add(target.subscribe(
                // next
                function(message) {
                    // contain the zip messages by internal counter and zipped position
                    zipped[counter] = (zipped[counter] || []);
                    // set the message to the key pos of target into latest
                    zipped[counter][key] = message;
                    // only emits when a message is present for all targets
                    if (zipped[counter].length === targets.length) {
                        // attempt to schedule the message
                        try {
                            // values in array form
                            const values = zipped[counter].concat();
                            // clear the latest emissions obj (outside of scheduled operation)
                            zipped[counter].splice(0, values.length-1);
                            // serve the message
                            observer.next((project ? project(...values) : values));
                        } catch (err) {
                            // catch and emit any errors
                            this.error(err);
                        }
                    }
                    // internal message counter
                    counter++;
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
                    // remove the teardown instruction - no need to call again after dropping
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
                    // remove the teardown instruction - no need to call again after dropping
                    if (remove) remove((remove = false));
                    // stream complete
                    if (!observer._closed && unsubscribed === targets.length) {
                        // clear zipped references
                        zipped.splice(0, zipped.length-1);
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