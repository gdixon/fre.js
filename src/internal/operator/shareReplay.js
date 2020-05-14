
// create a Subject to share via a Connectable - bufferSize, windowTime, schedule
import { ReplaySubject } from "../replaySubject.js";
// this operator proxies the request via Multicast
import { multicast } from "./multicast.js";

// Shares the subscription from any Operators on the (left of the or/and the selector) Pipe with future Operators/subscriptions (one to many) and replays the messages according to replay options
export const shareReplay = function (bufferSize, windowTime, scheduler, useRefCount, selector, options) {
    // hydrate values if provided as object
    let args = (typeof bufferSize === "object" ? bufferSize : (typeof windowTime === "object" ? windowTime : false));
    // hydrate values from optional options object...
    if (args) {
        // bufferSize might be provided as a number
        bufferSize = (typeof bufferSize === "number" ? bufferSize : args.bufferSize);
        // all other arguments are from args
        windowTime = args.windowTime;
        scheduler = args.scheduler;
        useRefCount = args.refCount;
        selector = args.selector;
        // collect all other attributes into the options collection if not provided as named argument
        options = (args.options || Object.keys(args).filter((k) => ["windowTime", "scheduler", "refCount", "selector"].indexOf(k) == -1).reduce((carr, k) => {
            // record the option
            carr[k] = args[k];

            // return the rest
            return carr;
        }, {}));
    }
    // build a publisherFactory by running options through multicast
    const publisherFactory = multicast(() => new ReplaySubject(bufferSize, windowTime, scheduler), selector, Object.assign(
        {
            // this forces the refCount to take place (connect the stream) and only renews Subjects if theyre present in .closed==true state
            replay: true,
            // pass through the refCount ability (Bool - should the subject close if 0 connections are present? - default is true when unprovided)
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