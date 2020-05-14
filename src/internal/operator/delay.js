// base Operator all others should be able to fit into...
import { operator } from "./operator.js";
// should auto to async when a scheduler isnt provided...
import { Async } from "../scheduler/singleton/async.js";

// on subscribe of response attaches an Observer to this Observable which will delay all messages for the given delay
export const delay = function (time, scheduler, unsubscribe) {
    // allow for the schedule to be undefined and overload unsubscribe pos
    unsubscribe = (scheduler && scheduler.schedule ? unsubscribe : scheduler);
    // use the default schedule only if provided
    scheduler = (scheduler && scheduler.schedule ? scheduler : Async);
    // build a publisherFactory by running methods through operator
    const publisherFactory = operator(undefined, (observer, message) => {
        // delay the message on to the observer
        scheduler.schedule(function () {
            // push messahe through
            observer.next(message);
        }, time);
    }, undefined, (observer) => {
        // when complete is called check all messages have been received else time out for the delay
        scheduler.schedule(function () {
            // complete the new observer
            observer.complete();
        }, time);
    }, (observer) => {
        // unsubscribe the new observer
        if (unsubscribe) unsubscribe();
        // if unsubscribe is called dont wait for messages to finish sending - just finish by calling unsubscribe on the observer
        observer.unsubscribe();
    });

    // create an observable instance (equal to constructor) to pass the mapped messages to
    return (ctx) => {

        // create a subscription on this constructor to push the projected message
        return publisherFactory(ctx);
    };
};