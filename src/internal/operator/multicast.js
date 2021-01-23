// if we're passing a selector to multicast we should lift to an Observable
import { Observable } from "../observable.js";
// produce a ConnectableObservable to chain and share the connection (if no selector is provided)
import { Connectable, getSubjectFactory, refCount} from "../observable/connectable.js";

// on subscribe of response, a Subject (produced via SubjectFactory) will be subscribed to the given ctx and the piped Observers/selector Observer will be subscribed to that Subject
// - this serves to:
// -- create hot Observables from cold (or hot) Observables (or Subjects)
// -- reduce the load on the source Observable (ctx) by caching the messages and re-emitting them without the pre-computation
// -- construct deferred chains of execution* (that wont start producing messages until they are "connected" (*this describes the "publish" Operator (ie, no "selector" and no "refCount" options)))
export const multicast = function (subjectFactory, selector, options) {
    // default the provided options to empty obj
    options = (options ? options : {});

    // multicast will return a new Observable in one of two variants:
    // -- if no selector is provided the call will return a Connectable which will hold subscription to the source (*) so long as it has subscribers
    // -- if selector is provided the call will return a multicasted Observable which will hold subscription to the source (*) until the source completes 
    // -- * Subjects are constructed via the provided SubjectFactory and can be replaced with any type which extends Subject
    return (ctx) => {
        // provided ctx is used as the source for the Multicasting...
        // - selector fn can use the multicasted source stream as many times as needed without causing multiple subscriptions to the source stream
        //   Subscribers to the given source will receive all notifications of the source from the time of the subscription forward
        // - Connectables are produced when the Selector is ommited, Connectables only start receiving notifications after they are connected to the source stream:
        //   each Connectable can be connected manually (.connect()) or automatically via the "refCount" option - each new Connectable produces a new Subscriber to the Source
        if (selector) {
            // move to the correct subjectFactory - this wraps the given subjectFactory with construction details (when to renew and what to call (fed with options))
            const factory = getSubjectFactory(subjectFactory, options);
            // create an Observable with the basic functionality offered to Connectable minus the "connect" methods/state
            const connected = new Observable(function (subscriber) {
                // localise the subject as a var in context
                const subject = factory.call(this).observer;
                // check if the subject is being connected in this subscription
                const connecting = (!subject._connected);
                // pipe the subject as ctx against the selector (selector will subscribe to the subject on subscription made to piped)
                const subjected = subject.pipe(selector);
                // assoicate supplied onUnsubscribe method to tie in with the onSubscribe method - called AFTER the subscriber is dropped
                if (options.onUnsubscribe) {
                    // connected before onSubscribe incase of early disconnect
                    subscriber.add(() => options.onUnsubscribe.call(this._subject, subscriber, subject));
                }
                // call supplied subscriber binding to connectable (passing the observer and subject as params - called BEFORE subscription is made)
                if (options.onSubscribe) {
                    // pass all the details in - this method is used internally to connect shared connectables automatically
                    options.onSubscribe.call(this._subject, subscriber, subject);
                }
                // subscribes the observer to the selector which is subscribed to the subject which is going to be subscribed to the ctx
                subscriber = subjected.subscribe(subscriber);
                // apply the refCount logic to the sequence (refCount is still optional for selector built multicasts - controls how we disengage the connected subject)
                if (this.options.refCount || this.options.replay) refCount.call(this._subject, this, subscriber, options);
                // call connect inside each subscriber (if connecting - to simulate connectable behaviour)
                if (connecting && options.onConnect) options.onConnect.call(this, this._subject);
                // Subject subscription can only be made once against a Subject - but n* times against an Observable (if the observable disconnects from source)
                if (connecting || subject.isStopped) this._source.subscribe(this._subject);
            }, options);
            // any selectors working off of the connectedObservable should lift to the ctx's lift type
            connected._lift = ctx._lift;
            // default the refCount (work as a mutable object with single count prop to share counts if we need to)
            connected._ref = { count: 0 };
            // like connectable, connected should hold source and subject inorder to carry the same interface
            connected._source = ctx;
            // subject is gathered by constructing through the derived subjectFactory
            connected._subject = factory.call(connected);
            // mark as connected (if a selector is passed we're not returning a connectable so _connected is rendundant but might still be nice to know)
            connected._connected = true;
            // subject retrieved from factory prepare using construct in options
            if (options.onConstruct) options.onConstruct.call(connected, connected._subject);

            // return the connected observable
            return connected;
        }

        // create a single subscription on ctx allowing for multiple subscriptions to be multicast by the returned ConnectableObservable
        return new Connectable(ctx, subjectFactory, options);
    };
};
