
// create a Subject to share via a Connectable - bufferSize, windowTime, schedule
import { BehaviourSubject } from "../behaviourSubject.js";
// this operator proxies the request via Multicast
import { multicast } from "./multicast.js";

// Shares the subscription from any Operators on the (left of the or/and the selector) Pipe with future Operators/subscriptions (one to many) and replays the messages according to replay options
export const shareBehaviour = function (initialValue, useRefCount, selector, options) {
    // hydrate values if provided as object
    let args = (typeof useRefCount === "object" ? useRefCount : (typeof selector === "object" ? selector : false));
    // hydrate values from optional options object...
    if (args) {
        // refCount might be provided as option set or bool...
        useRefCount = (typeof useRefCount !== "object" ? useRefCount : args.refCount);
        // selector and options always from args (if present);
        selector = args.selector;
        // collect all other attributes into the options collection if not provided as named argument
        options = (args.options || Object.keys(args).filter((k) => ["refCount", "selector"].indexOf(k) == -1).reduce((carr, k) => {
            // record the option
            carr[k] = args[k];

            // return the rest
            return carr;
        }, {}));
    }
    // build a publisherFactory by running options through multicast
    const publisherFactory = multicast(() => new BehaviourSubject(initialValue), selector, Object.assign(
        {
            // this forces the autoconnect to take place (connect the stream) and renews Subjects when theyre present in .closed==true state
            replay: true,
            // pass through the refCount ability (Bool - should the subject close if 0 connections are present? only closes & renews Subject's connection if the source completes)
            refCount: useRefCount
        }, 
        options
    ));

    // produce a single Operator from the instructions using the first ctx and return it for all future requests
    return (ctx) => {

        // create a subscription on this Observable to push the projected message (if refCount is true we push to a single Subject and end subscription to source on completion)
        return publisherFactory(ctx);
    };
};