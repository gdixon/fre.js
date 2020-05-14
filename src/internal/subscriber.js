// Observer allows us to construct a closable wrapper around the given methods if not already Observer(like)
import { Observer } from "./observer.js";

// Subscription holds the Subscribers teardown logic
import { Subscription } from "./subscription.js";


// Subscriber implements the Observer interface and extends Subscription - wrapping the given Observer(like) with teardown logic
export class Subscriber extends Subscription {

    // static method to create a new observer
    static create(nextOrObserver, error, complete, unsubscribe) {

        // straight pass through to the constructor
        return new Subscriber(nextOrObserver, error, complete, unsubscribe);
    }

    constructor(nextOrObserver, error, complete, unsubscribe) {
        // register/create the observer/subscriber
        const observer = (typeof nextOrObserver == "object" ? nextOrObserver : new Observer(nextOrObserver, error, complete, unsubscribe));
        // register the observers unsubscribe method into the subscription (this is called after Subscriptions teardown)
        super(() => observer.unsubscribe());
        // record observer so we can pass messages to it directly on events
        this.observer = observer;
    }

    next(message) {
        // ensure the chain is open
        if (!this.closed && this.observer) {
            try {
                // push message to the observer
                this.observer.next(message);
            } catch (e) {
                // push error through
                this.error(e);
            }
        }
    }

    error(e) {
        // ensure the chain is open
        if (!this.closed && this.observer) {
            // push error to the observer -- this could throw?
            this.observer.error(e);
            // drop subscription after receiving error message errors close the chain regardless of if complete was called first
            if (!this.operator) this.unsubscribe(true);
        }
    }

    complete() {
        // ensure the chain has not already completed/unsubscribed
        if (!this.isStopped && this.observer) {
            // mark as stopped when completed
            this.isStopped = true;
            // attempt the complete call
            try {
                // call fn and test if the completion should propagate to an unsubscribe call (should only happen on the final chained observers complete)
                this.observer.complete();
            } catch (e) {
                // propagate error through this subscriber
                this.error(e);
            }
            // final Subscriber in the chain is responsible for calling out to the unsubscribe operation after a complete
            if (!this.operator) this.unsubscribe();
        }
    }

    unsubscribe(force) {
        // ensure the chain has not already unsubscribed - if the Observer was previously stopped dont mark closed
        if (!this.closed) {
            // when isStopped is present the subscriber does not mark closed (this shows us the Observer completed)
            const closed = (this.isStopped && !force ? this.closed : true);
            // unsub on the dest - * note that any errors in .unsubscribe method will propagate to .observer.error (but wont hit subscriber again)
            super.unsubscribe(closed);
        }
    }
}