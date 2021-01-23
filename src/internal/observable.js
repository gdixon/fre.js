// Observable will accept Observer or Observer methods on subscribe and return a Subscriber (observer with teardown logic)
import { Subscriber } from "./subscriber.js";

// import basic frp Operators for proxies on instance
import { map } from "./operator/map.js";
import { filter } from "./operator/filter.js";
import { reduce } from "./operator/reduce.js";

// Observable will call provided subscriber function for every new Subscription (of an an Observer)
export class Observable {

    // static method to create a new Observable
    static create(subscriber, options) {

        // straight pass through to the constructor
        return new Observable(subscriber, options);
    }

    // subject has observers and an update method
    constructor(publisher, options) {
        // clone the given option set (so we can safely modify)
        options = Object.assign({}, options);
        // record the options
        this.options = options;
        // record state of the Observable stack
        this._error = false;
        // place lift type to build pipe chain from publisherFactories
        this._lift = Observable;
        // assign the publisher internally - this can be called n* times and stacked inorder to monkey-patch setPublisher((subscriber, prevPublisher) => {})
        this.setPublisher(publisher);
    }

    // place symbol definition for interop (returns instance)
    [typeof Symbol === "function" && Symbol.observable || "@@observable"]() {

        // returns Observable instance
        return this;
    }

    // set/modify subscriber after init and call to any observers that are currently registered
    setPublisher(publisher) {
        // should doing this call each subscribed Observer against new subscriber method?
        if (publisher && typeof publisher === "function") {
            // retrive the old subscribe
            const prevPublisher = this._publisher;
            // record the new subscriber in a wrapper (with access to the old subscriber - this will allow us to chain subscribers)
            this._publisher = function (subscriber) {

                // calls to the provided subscriber (which can optionally use the previous subscriber to extend/drop previous work)
                return publisher.call(this, subscriber, prevPublisher);
            };
        }
    }

    // Add an observer to this.observers.
    subscribe(next, error, complete, unsubscribe) {
        // construct a subscriber for the methods -- if given next is subscriberLike use that instead
        const subscriber = (next && next.observer ? next : new Subscriber(next, error, complete, unsubscribe));
        // mark that the observer entered connected state
        subscriber.observer._connected = true;
        // ensure the subscriber is in place
        if (!subscriber.closed && this._publisher) {
            // catch any errors in the subscriber
            try {
                // call the assigned subscriber to emit stream against the new observer
                const teardown = this._publisher.call(this, subscriber);
                // add the teardown if the subscribers still open
                if (teardown) subscriber.add(teardown);
            } catch (e) {
                // pass in any errors
                subscriber.error(e);
            }
        }

        // return a Subscription instance so that the Observer can be unsubscribed (this can be returned even if subscription wasnt made yet)
        return (!subscriber.closed ? subscriber : new Subscriber());
    }

    // on subscribe of response attaches an Observer to this Observable which will map the data value
    // according to project and forward new message to new Observable instances Observers
    map(project, unsubscribe) {

        // return super.map(project, unsubscribe);
        return this.pipe(map(project, unsubscribe));
    }

    // on subscribe of response attaches an Observer to this Observable which will filter the data value
    // according to project and forward valid messages to new Observable instances Observers
    filter(project, unsubscribe) {

        // return the observable (which will accept .subscribe etc)
        return this.pipe(filter(project, unsubscribe));
    }

    // on subscribe of response attaches a Observer to this Observable which will reduce the data value
    // according to project and forward final value to new Observable instances Observers
    reduce(project, initialValue, unsubscribe) {

        // return the observable (which will accept .subscribe etc)
        return this.pipe(reduce(project, initialValue, unsubscribe));
    }

    // lift an instance against the current ctx (* note that all Subject-likes will lift to a Subject (so that only the source instance carries out replays))
    lift(operator) {
        // construct a new subject to house the operator
        const observable = this._lift.create();
        // set the operator as a publisher directly into the new observable(like)
        observable._publisher = operator;

        // return the newly prepared instance
        return observable;
    }
    
    // transform the stream using Operators (Operator signiture == (...) => (prev) => Observable/(subscriber) => {...})
    pipe(...args) {

        // immediately create the pipe ensuring all Operators resolve to an Observable
        // - reduce the piped Observables by applying the next to the prev 
        // - we reduce starting with "this" as the root source (current ctx is where the messages will be sourced from)
        // - * note the operator must always be pipeable (should accept the prev as an argument and return an Observable)
        return args.reduce((ctx, operator) => {
            // check for operator
            if (operator && typeof operator == "function") {
                // return the piped Observable/Subject (or connectableObservable)
                ctx = operator(ctx);
                // ensure the chain is always of Observable types
                if (!(ctx && typeof ctx.subscribe == "function")) {
                    // error out if the ctx is ever !observable
                    throw("cannot pipe to !Observable constructs");
                }
            }

            // allow missing Operators (conditional inclusions) to skipout and move to next by returning prev
            return ctx;
        }, this);
    }
}
