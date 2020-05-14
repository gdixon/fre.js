// Extend Observable to allow for a Subject (built from provided factory) to be connected to source on call to Connectables .connect (all subscribes are proxied to the Subject)
import { Observable } from "../observable.js";
// Subjects extend the behaviour of Observable to allow for multicasting of messages (one source many subscribers)
import { Subject } from "../subject.js";
// Subscribers wrap Observers being connected to the Subject
import { Subscriber } from "../subscriber.js";

// A ConnectableSubject is an Observable that wraps a Subject and only starts emitting when .connect is called (and the subject is subscribed to source)
// - instances themselves are never subscribed to any source
// - they instrument a child-subject to start carrying out work after .connect is called
export class Connectable extends Observable {

    // static method to create a new observable
    static create(source, subjectFactory, options) {

        // straight pass through to the constructor
        return new Connectable(source, subjectFactory, options);
    }

    // connectableObservable has a refCount, a _source, a _subject, _connected state and a connect method
    constructor(source, subjectFactory, options) {
        // super passing in options
        super(undefined, options);
        // lift matches the lift of the source
        this._lift = source._lift;
        // record the source that we're going to subscribe against on connect
        this._source = source;
        // track connected state
        this._connected = false;
        // make the provided subjectFactory safe to use (detect closures and renew) and default to basic Subject if !factory is provided
        this._subjectFactory = getSubjectFactory(subjectFactory, options);
        // retreive a subject instance
        this._subject = this._subjectFactory.call(this);
        // carry out any construct work according to the usecase (eg set up buffer for shareReplay)
        if (this.options.onConstruct) this.options.onConstruct.call(this, this._subject);
    }

    // subscribe all observers through to the (dis)connected subject
    subscribe(next, error, complete, unsubscribe) {
        // subject that we're currently pointing to might be stopped
        const subject = this._subject;
        // if it is we create a new one using getSubject and check if its new by compaing against subject
        const target = this._subjectFactory.call(this).observer;
        // Subscriber wraps Observer to provide outside teardown logic to the Observer
        const subscriber = (next && next instanceof Subscriber ? next : new Subscriber(next, error, complete, unsubscribe));  
        // assoicate supplied onUnsubscribe method to tie in with the onSubscribe method
        if (this.options.onUnsubscribe) {
            // connected before calling onSubscribe incase of early unsubscribe?
            subscriber.add(() => this.options.onUnsubscribe.call(this._subject));
        }
        // call supplied subscriber binding to connectable (passing the observer and subject as params)
        if (this.options.onSubscribe) {
            // pass all the details in - this method is used internally to connect shared connectables automatically
            this.options.onSubscribe.call(this._subject, subscriber, target);
        }
        // subscribe the observer to the subject (unsubscribe from subject cascades so dont need to instruct observer.subscription)
        const subscription = target.subscribe(subscriber);
        // apply the refCount logic to the sequence (if called for) - replays use refCount to connect the stream (if !selector)
        if (this.options.refCount || this.options.replay) refCount.call(this._subject, this, subscriber, this.options);
        // connect the new subject to the source (forcing new subscription - if in isStopped state)
        if (this._connected && subject.observer !== target) this.connect(true);
        
        // return simple subscription to the subject
        return subscription;
    }

    // connect the subject to the source
    connect(forceNewConnection) {
        // get current subject (attempting to create new via getSubject here would create an endless loop if the subscriber contains a call to connect)
        const subject = this._subject;
        // if the subject is renewed - subscribe to source again
        if (forceNewConnection || !this._connected) {
            // mark as connected (one-way operation - a connectable can never be returned to !connected state - connectables are not connected by just subscribing must connect)
            this._connected = true;
            // intercept the connect call inorder to modify the subject before subscription
            if (this.options.onConnect) this.options.onConnect.call(this, subject.observer);
            // subscribe the subject to the source (which will invoke subjects observers with source messages - subscription is only handled internally in this script)
            this._source.subscribe(subject);
        }
    }
}

// pull the current subject from context
export const getSubjectFactory = function (subjectFactory, options) {

    // returns a subjectFactory which will negotiate the provided subjectFactory to get to the appropriate Subject to multicast against
    return function () {
        // align the multicast with proper 
        const multicast = this;
        // reference to the currently set _subject
        const subject = multicast._subject;
        // options.replay toggles when to create a new subject -- on subject.closed (true) or subject.isStopped (false)
        // this option is always passed by shareReplay to keep any stopped replays around after the last subscriber drops it
        // but not when the subject is unsubscribed (by refCount)
        if (!subject || (options.replay ? subject.closed : subject.isStopped)) {
            // pull the subject from provided factory (or default to new Subject)
            const target = (subjectFactory instanceof Subject ? subjectFactory : (typeof subjectFactory === "function" ? subjectFactory() : new Subject()));
            // if this is a new subject run through the set-up - creating subscriber logic on the Subject (only needs to be done once per subject)
            if (!subject || target !== subject.observer) {
                // move to a subscriber of the target
                multicast._subject = new Subscriber(target);
                // attaches an additional unsubscribe method to the subject (to be ran when the subject unsubscribes)
                if (options.onDisconnect && !target.isStopped) {
                    // carryout the additional teardown logic - * note that this only applies after .connect because the child wont call unsubscribe on !connected _subject
                    multicast._subject.add(() => { options.onDisconnect.call(multicast._subject); });
                }
            }
        }
        
        // always returns the currently active subject
        return multicast._subject;
    };
};

// called against the Subject's Subscriber's context with access to the parent multicast and the Subscriber we're connecting to the subject
export const refCount = function (multicast, subscriber, options) {
    // only when refCount is not disabled (defaulting options.refCount to true - to disable explicitly pass options.refCount = false (in shareReplay))
    if (options.refCount !== false) {
        // default the refCount
        multicast.refCount = (multicast.refCount || 0);
        // increment the refCounter when the subscription is opened
        multicast.refCount++;
        // decrement the refCounter when the subscription is killed
        subscriber.add(() => {
            // drop refCount if Observer unsubscribes
            multicast.refCount--;
            // unsubscribes the outerSubscription when the refCount reaches 0 (no observers) if we're coming from a shareReplay we check for completion
            const keepSubject = (options.replay ? !this.isStopped : true);
            // only keeping the subject in shareReplays when the subject did not complete (otherwise we unsubscribe and create new on next subscription)
            if (multicast._connected && keepSubject && multicast.refCount == 0) {
                // drop the subject from its source
                this.unsubscribe();
            }
        });
    }
    // call connect to ensure connection on source (once on creation of first Subject)
    if (multicast.connect && !multicast._connected) multicast.connect();
};