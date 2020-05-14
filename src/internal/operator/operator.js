// Subscriber accepts an Observer/Observers methods and wraps with teardown logic
import { Subscriber } from "../subscriber.js";

// produce the internal Operator methodology - returns a subscriber method to be placed inside an Observable wrapping provided methods
const PublisherFactory = function (ctx, setUpFactory, next, error, complete, unsubscribe) {

    // produce a new Observable to transform the streams values (Operators call Base with their workload)
    return function (subscriber) {
        // contain the operators state for each subscription - filled by setUp before subscribing subscriber
        let state = {};
        // create a new Observer to connect the Observer via the given Operator methods to the ctx
        const operator = new Subscriber(
            // apply methods to the operator such that they route all invokes to the ctx subscriber
            function (message) {
                // if next is provided then it should call to Observer with the message
                if (typeof next === "function") {
                    // call provided next method - which should perform actions and forward message to the ctx subscriber
                    next.call(this, subscriber, message, state);
                } else {
                    // chain to the ctx subscribers .next method
                    subscriber.next(message);
                }
            },
            // push error messages through to the subscriber
            function (e) {
                // if error is provided then it should call subscriber.error
                if (typeof error === "function") {
                    // call provided error method - which should perform actions and forward message to the ctx subscriber
                    error.call(this, subscriber, e, state);
                } else {
                    // chain to the ctx subscribers .error method
                    subscriber.error(e);
                }
            },
            // when complete is called we should close the outer after calling complete on inner
            function () {
                // if complete is provided then it should call subscriber.complete
                if (typeof complete === "function") {
                    // complete the call via the given complete method - complete method must eventually call subscriber.complete
                    complete.call(this, subscriber, state);
                } else {
                    // complete the subscriber directly
                    subscriber.complete();
                }
            },
            // on unsubscribe we drop the subscription and call the sources unsubscribe method aswell as the unsubscribe method supplied to map (against individual Observers)
            function () {
                // if unsubscribe is provided then it should call subscriber.unsubscribe
                if (typeof unsubscribe === "function") {
                    // carry out additional unsubscribe work (ending with call to subscriber.unsusbcribe)
                    unsubscribe.call(this, subscriber, state);
                } else {
                    // chain to the ctx subscribers .unsubscribe method
                    subscriber.unsubscribe();
                }
            }
        );
        // mark as an Operator - doing so disables unsubscribes from flowing after the complete in this procedure
        operator.operator = true;
        // create and record Subscription before subscribing the operator to ctx so that unsubscribes can dispose the chain synchronously
        subscriber.add(operator);
        // set-up against the operator just before we subscribe it to ctx
        if (setUpFactory && typeof setUpFactory === "function") {
            // handle this in a try catch so that we can propagate errors to the ctx subscriber
            try {
                // if setup doesnt return anything then reregister subscriber
                state = setUpFactory.call(operator, subscriber, state);
            } catch (e) {
                // throw any errors through the chain
                operator.error(e);
            }
        } else if (typeof setUpFactory === "object") {
            // a shallow clone of the initial setUp (create a new object of same type and fill with first level of setUp obj)
            state = Object.assign(new setUpFactory.constructor(), setUpFactory);
        }
        // subscribe this instance (operator) to the ctx
        if (!operator.closed) ctx.subscribe(operator);
    };
};

// allow for an Operator scenario to be built into a piped method directly
export const operator = function (setUp, next, error, complete, unsubscribe) {

    // subscribe to the ctx only when .connect is called on the observable instance
    return function (ctx) {

        // create and return a new "lifted" construct to house the operators publisher (*lifted instance carries same hot/cold profile as ctx)
        return ctx.lift(PublisherFactory(ctx, setUp, next, error, complete, unsubscribe));
    };
};