// create a Subject to share via a Connectable
import { Subject } from "../subject.js";
// this operator proxies the request via Multicast
import { multicast } from "./multicast.js";

// Shares the subscription from any Operators on the (left of the) Pipe with future Operators/subscriptions
export const share = function (selector, options) {
    // hydrate values if provided as object
    const args = (typeof selector === "object" ? selector : false);
    // hydrate values from optional options object...
    if (args) {
        // selector might be provided as a function...
        selector = args.selector;
        // collect all other attributes into the options collection if not provided as named argument
        options = (args.options || Object.keys(args).filter((k) => ["selector"].indexOf(k) == -1).reduce((carr, k) => {
            // record the option
            carr[k] = args[k];

            // return the rest
            return carr;
        }, {}));
    }
    // build a publisherFactory by running options through multicast
    const publisherFactory = multicast(() => new Subject(), selector, Object.assign(
        {
            // pass through the refCount ability (should the subject close if 0 connections are present?)
            refCount: true
        },             
        // finally feed in the options allowing us to overide anything set previously
        options
    ));

    // produce a single Operator from the instructions using the first ctx and return it for all future requests
    return (ctx) => {
        
        // create a subscription on this Observable to push the projected message
        return publisherFactory(ctx);
    };
};