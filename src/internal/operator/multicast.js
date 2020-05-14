// if we're passing a selector to multicast we should lift to an Observable
import { Observable } from "../observable.js";
// produce a ConnectableObservable to chain and share the connection (if no selector is provided)
import { Connectable, getSubjectFactory, refCount} from "../observable/connectable.js";

// on subscribe of response attaches an Observer to this Shared instance which will multicast the data value
// through a shared Subject instance - this serves to create a hot Observable from cold( or hot) Observables(or Subjects) 
// where Subscribers share a single subscription to the source (ctx)
export const multicast = function (subjectFactory, selector, options) {
    // default the provided options to empty obj
    options = (options ? options : {});

    // multicast creates a new Subject of two variaties - connectable/subject
    // -- if no selector is provided the call will return a Connectable which will hold subscription to the source so long as it has subscribers
    // -- if selector is provided the call will return a Subject (*like) which will hold subscription to the source until the source completes 
    // -- * Subjects are constructed via the provided SubjectFactory and can be replaced with any type which extends Subject
    return (ctx) => {
        // selector should be provided the shared Subject as ctx
        if (selector) {
            // move to the correct subjectFactory - this wraps the given subjectFactory with construction details (when to renew and what to call (fed with options))
            const factory = getSubjectFactory(subjectFactory, options);
            // contain the refCount state against a single subject
            const connected = new Observable(function (subscriber) {
                // localise the subject as a var in context
                const subject = factory.call(connected).observer;
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
                subjected.subscribe(subscriber);
                // apply the refCount logic to the sequence (refCount is still optional for selector built multicasts - controls how we disengage the connected subject)
                if (connecting) refCount.call(this._subject, this, subscriber, options);
                // call connect inside each subscriber (if connecting - to simulate connectable behaviour)
                if (connecting && options.onConnect) options.onConnect.call(this, subject);
                // Subject subscription can only be made once against a Subject - but n* times against an Observable (if the observable disconnects from source)
                if (connecting || subject.isStopped) this._source.subscribe(this._subject);
                // mark as connected (if a selector is passed we're not returning a connectable so _connected is rendundant but might still be nice to know)
                // this._connected = true;
            }, options);
            // any selectors working off of the connectedObservable should lift to the ctx's lift type
            connected._lift = ctx._lift;
            // like connectable, connected should hold source and subject inorder to carry the same interface
            connected._source = ctx;
            // subject is gathered by constructing through the derived subjectFactory
            connected._subject = factory.call(connected);
            // subject retrieved from factory prepare using construct in options
            if (options.onConstruct) options.onConstruct.call(connected, connected._subject);

            // return the connected observable
            return connected;
        }

        // create a single subscription on ctx allowing for multiple subscriptions to be multicast by the returned ConnectableObservable
        return new Connectable(ctx, subjectFactory, options);
    };
};
