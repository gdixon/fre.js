// publish against a single subject (cannot be restarted)
import { Subject } from "../subject.js";
// this operator proxies the request via Multicast
import { multicast } from "./multicast.js";

// delays subscriptions via a connectableObservable which runs through subscribers on call to .connect (all future subscribes after .connect are ran immediately)
export const publish = function (selector, refCount, options) {
    // hydrate values if provided as object
    const args = (typeof selector === "object" ? selector : (typeof refCount === "object" ? refCount : false));
    // hydrate values from optional options object...
    if (args) {
        // selector might be provided as a function...
        selector = (typeof selector === "function" ? selector : args.selector);
        // refCount and options always from args (if present);
        refCount = args.refCount;
        // collect all other attributes into the options collection if not provided as named argument
        options = (args.options || Object.keys(args).filter((k) => ["selector", "refCount"].indexOf(k) == -1).reduce((carr, k) => {
            // record the option
            carr[k] = args[k];

            // return the rest
            return carr;
        }, {}));
    }
    // build a publisherFactory by running options through multicast
    const publisherFactory = multicast(new Subject(), selector, Object.assign({
        // pass through the refCount ability (should the subject close if 0 connections are present?)
        refCount: !!refCount
    }, options));

    // start a multicasting (this shares the connectableObservable along the pipe)
    return (ctx) => {

        // return an instance of the multicast with ctx associated (note that SubjectFactory points to a single Subject - complete means complete.)
        return publisherFactory(ctx);
    };
};