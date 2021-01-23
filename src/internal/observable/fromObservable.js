// this module creates Observable instances...
import { Observable } from "../observable.js";
// construct a new subscription if provided a scheduler to contain the teardown
import { Subscription } from "../subscription.js";

// static method to create a new Observable from an Observable (essentially a clone)
export const FromObservable = function (input, scheduler, options) {

    // straight pass through to the constructor
    return new Observable((subscriber) => {
        // construct method to be ran with or without scheduler
        const Symbol_observable = (typeof Symbol === "function" && Symbol.observable) || "@@observable";
        // next through each items on the observer
        if (typeof input[Symbol_observable] === "function" && typeof input.subscribe == "function") {
            // if the obserable is to be scheduled onto a scheduler...
            if (scheduler && typeof scheduler.schedule === "function") {
                // collate the scheduled cancellations in seperate subscription construct
                const sub = new Subscription();
                // schedule the registration (two deep)
                sub.add(scheduler.schedule(() => {
                    // access the observables context
                    const observable = input[Symbol_observable]();
                    // schedule the registration - then schedule each of the message types to preserve micro/marco queue dest
                    sub.add(observable.subscribe(
                        (value) => { sub.add(scheduler.schedule(() => subscriber.next(value))); },
                        (err) => { sub.add(scheduler.schedule(() => subscriber.error(err))); },
                        () => { sub.add(scheduler.schedule(() => subscriber.complete())); },
                        () => { sub.add(scheduler.schedule(() => subscriber.unsubscribe())); }
                    ));
                }));

                // return the subscription to be added to the subscribers teardowns
                return subscriber;
            } else {

                // subscriber to target observable
                return input[Symbol_observable]().subscribe(subscriber);
            }
        } else {
            // if not observable type cannot observe it
            throw ((input !== null && typeof input) + " is not observable");
        }
    }, options);
};