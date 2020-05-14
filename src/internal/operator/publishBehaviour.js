// publish against a single subject (cannot be restarted)
import { BehaviourSubject } from "../behaviourSubject.js";
// this operator proxies the request via Multicast
import { multicast } from "./multicast.js";

// delays subscriptions via a connectableObservable which runs through subscribers on call to .connect (all future subscribes after .connect are ran immediately)
export const publishBehaviour = function (initialValue, refCount, selector, options) {
    // hydrate values if provided as object
    const args = (typeof refCount === "object" ? refCount : (typeof selector === "object" ? selector : false));
    // hydrate values from optional options object...
    if (args) {
        // refCount might be provided as option set or bool...
        refCount = (typeof refCount !== "object" ? refCount : args.refCount);
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
    const publisherFactory = multicast(new BehaviourSubject(initialValue), selector, Object.assign({
        // pass through the refCount ability (should the subject close if 0 connections are present?)
        refCount: !!refCount
    }, options));

    // start a multicasting (this shares the connectableObservable along the pipe)
    return (ctx) => {

        // return an instance of the multicast with ctx associated (note that SubjectFactory points to a single Subject - complete means complete.)
        return publisherFactory(ctx);
    };
};