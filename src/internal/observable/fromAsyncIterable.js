// this module constructs Observable instances by converting an iterable to an observable stream
import { Observable } from "../observable.js";
// create a new subscription to hold scheduled unsubscribe action
import { Subscription } from "../subscription.js";

// static method to create a new Observable from an Array of values to be emitted
export const FromAsyncIterable = function (input, scheduler, options) {

    // straight pass through to the constructor
    return new Observable((subscriber) => {
        // ensure the input is an iterable construct
        if (input && Symbol && Symbol.asyncIterator && input[Symbol.asyncIterator]) {
            // source the array by running through from
            // * note that Array.from will always return an array even if provided a non iterable source
            // const source = Array.from(array);
            const iterator = input[Symbol.asyncIterator]();
            // construct method to be ran with or without scheduler
            const inner = function (next) {
                // iterate the collection
                iterator.next().then(result => {
                    if (result.done) {
                        subscriber.complete();
                    } else {
                        subscriber.next(result.value);
                        next(next);
                    }
                }).catch(e => subscriber.error(e));
            };
            // when scheduler is provided...
            if (scheduler && typeof scheduler.schedule === "function") {
                // create a new subscription to house the scheduled messages
                const subscription = new Subscription();
                // schedule the messages against the scheduler (because this can place us in a marco/micro queue - we should store cancellation procedure inside the subscriber)
                subscription.add(scheduler.schedule(function () {
                    // provide the inner a mechanism to reschedule...
                    inner(() => {
                        // only rescheduling if we havent closed in the meantime
                        subscription.add(this.schedule());
                    });
                }));

                // return the subscription to be added into the subscribers teardowns
                return subscription;
            } else {
                // no schedule run through the array sychronoulsy (inner will invoke call to inner untill the index is equal to the length of source)
                inner(inner);
            }
        } else {
            // throw if not provided iterable instance
            throw("FromAsyncIterable must be provided iterable primitive");
        }
    }, options);
};
