// this module creates Observable instances...
import { Observable } from "../observable.js";
// messages should be scheduled so that delays are preserved
import { Async } from "../scheduler/singleton/async.js";

// merge Observable instances into one stream (streams each message as it is ready - can be used with Subject types)
export const Interval = function (delay, scheduler, options) {

    // create an observable instance (equal to constructor) to pass the all messages from all Observables to
    return new Observable(function(observer) {
        // keep markings so that we can hold on complete until we've actually completed
        let scheduled = 0, closed = false;
        // schedule against the asyncScheduler by default
        (scheduler && scheduler.schedule ? scheduler : Async).schedule(function() {
            // if the observable was torn down - stop emitting against the scheduler
            if (!closed) {
                // serve the message
                observer.next(scheduled);
                // mark the the message was sent
                scheduled++;
                // reschedule for next shift or cancel?
                this.schedule(true, delay);
            }
        }, delay, observer._closed);

        // return teardown instruction to be added to Subscriber
        return () => (closed = true);
    }, options);
};