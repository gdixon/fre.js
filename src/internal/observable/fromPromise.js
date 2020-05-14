// this module creates Observable instances...
import { Observable } from "../observable.js";
// construct a new subscription if provided a scheduler to contain the teardown
import { Subscription } from "../subscription.js";

// convert a Promise value into an Observable chain
export const FromPromise = function (input, scheduler, options) {

    // renders a single promise
    return new Observable((subscriber) => {
        // if the scheduler is value we can tunnel messages via the scheduler
        const validScheduler = (scheduler && typeof scheduler.schedule == "function");
        // construct a subscription to contain the schedulers teardowns
        const subscription = (validScheduler ? new Subscription() : null);
        // optionally schedule an action via the provided scheduler
        const scheduleAction = (action, ...args) => {
            // when the scheduler is valid forward all actions via the scheduler
            if (validScheduler) {
                // schedule the action to happen on scheduler
                subscription.add(scheduler.schedule(() => action(...args)));
            } else {
                // call immediatly in original context
                action(...args);
            }
        };
        // if we always schedule the action then we can intercept and push messages via optional scheduler
        scheduleAction(() => input.then(
            // resolve the promise and schedule the response onto the optional scheduler
            (message) => {
                // when promise resolves schedule the next on subscriber and complete
                scheduleAction(() => {
                    // push the message to the subscriber
                    subscriber.next(message);
                    // after promise resolves and message is sent we can complete the subscriber (work done)
                    scheduleAction(() => subscriber.complete());
                });
            },
            // reject - call through to the subscribers error method (resulting in unsubscribe)
            (e) => {
                scheduleAction(() => subscriber.error(e));
            })
        );
       
        // return the teardown subscription (if scheduled) to be included in the subscribers teardowns (or null)
        return subscription;
    }, options);
};
