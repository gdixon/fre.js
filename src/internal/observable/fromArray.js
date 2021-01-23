// this module constructs Observable instances by converting an iterable to an observable stream
import { Observable } from "../observable.js";
// create a new subscription to hold scheduled unsubscribe action
import { Subscription } from "../subscription.js";

// static method to create a new Observable from an Array of values to be emitted
export const FromArray = function(input, scheduler, options) {

    // straight pass through to the constructor
    return new Observable((subscriber) => {
        // index for the position in source so that we can run through either sychronously or with a scheduler
        let index = 0;
        // source the array by running through from
        // * note that Array.from will always return an array even if provided a non iterable source
        const source = Array.from(input);
        // construct method to be ran with or without scheduler
        const inner = (next) => {
            // if we're at the end of the source then complete the subscription
            if (index == source.length) {
                subscriber.complete();

                // return to avoid nexting without message and rescheduling
                return;
            }
            // project the next message in the source
            subscriber.next(source[index++]);
            // call the provided method to reschedule (either sychronously or via the scheduler (*note that the scheduler calls its work fn creating a new next fn each invoc))
            next(next);
        };
        // when scheduler is provided...
        if (scheduler && typeof scheduler.schedule === "function") {
            // create a new subscription to house the scheduled messages
            const subscription = new Subscription();
            // schedule the messages against the scheduler (because this can place us in a marco/micro queue - we should store cancellation procedure inside the subscriber)
            subscription.add(scheduler.schedule(function() {
                // provide the inner a mechanism to reschedule...
                inner(() => {
                    // only rescheduling if we havent closed in the meantime
                    if (!subscriber.closed) subscription.add(this.schedule());
                });
            }));

            // return the subscription to be added into the subscribers teardowns
            return subscriber;
        } else {
            // no schedule run through the array sychronoulsy (inner will invoke call to inner untill the index is equal to the length of source)
            inner(inner);
        }
    }, options);
};
