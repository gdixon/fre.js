// this module constructs Observable instances by converting an iterable to an observable stream
import { Observable } from "../observable.js";
// construct a new subscription if provided a scheduler to contain the teardown
import { Subscription } from "../subscription.js";

// static method to create a new Observable from an Iterable instance
export const FromIterable = function(input, scheduler, options) {

    // straight pass through to the constructor
    return new Observable((subscriber) => {
        // ensure the input is an iterable construct
        if (input && Symbol && Symbol.iterator && input[Symbol.iterator]) {
            // const source = Array.from(array);
            const iterator = input[Symbol.iterator]();
            // construct method to be ran with or without scheduler - next param will contain scheduling logic (or equal outer next)
            const next = (next) => {
                // catch errors from the generator to send to the subscriber
                try {
                    // get the next value from the iterator
                    const item = iterator.next();
                    // if we're at the end of the source then complete the subscription
                    if (item.done) {
                        subscriber.complete();
                        
                        // return to avoid nexting without message and rescheduling
                        return;
                    }
                    // project the next message in the source
                    subscriber.next(item.value);
                    // call the provided method to reschedule (either sychronously or via the scheduler (*note that the scheduler calls its work fn creating a new next fn each invoc))
                    next(next);
                } catch (e) {
                    // throw the error to the subscriber
                    subscriber.error(e);
                }
            };
            // finalize the iterator by setting done on generator - cancelling next
            subscriber.add(() => iterator.return());
            // when scheduler is provided...
            if (scheduler && typeof scheduler.schedule === "function") {
                // create a new subscription to house the scheduled messages
                const subscription = new Subscription();
                // schedule the messages against the scheduler (because this can place us in a marco/micro queue - we should store cancellation procedure inside the subscriber)
                subscription.add(scheduler.schedule(function() {
                    // provide the inner a mechanism to reschedule...
                    next(() => {
                        // only rescheduling if we havent closed in the meantime
                        subscription.add(this.schedule());
                    });
                }));

                // return the subscription to be added into the subscribers teardowns
                return subscription;
            } else {
                // no schedule run through the array sychronously (next will invoke call to next untill the iterable is done)
                next(next);
            }
        } else {
            // throw if not provided iterable instance
            throw("FromIterable must be provided iterable primitive");
        }
    }, options);
};
