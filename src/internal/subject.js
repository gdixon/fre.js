// Subjects extend the behaviour of Observable
import { Observable } from "./observable.js";

// Subjects have the properties of Observables and Observers - Observers are subscribed to a Subject and a Subject can be subscribed as an Observer to a Subject
import { Subscriber } from "./subscriber.js";

// A Subject is an Observable that can act like an Observer and an Observable at the same time (has a .next, finishes on .complete method etc... as well as Observers)
export class Subject extends Observable {

    // static method to create a new observable
    static create(options) {

        // straight pass through to the Subject constructor
        return new Subject(options);
    }

    // subject has observers and a next method
    constructor(options) {
        // super with no subscriber
        super(undefined, options);
        // record observers into an oridinary array
        this.observers = [];
        // assign the closed state
        this.closed = false;
        // on complete (regardless of unsub) - we mark as isStopped
        this.isStopped = false;
        // place the lift construct (used by all subjectLikes - .lift will use ._lift as source for creation)
        this._lift = Subject;
    }

    // subscribe an observer/subject to this Subject (subscribing to a Subject collects the Observer in subject.observers)
    subscribe(next, error, complete, unsubscribe) {
        // when the Subject is not closed we can subscribe - when closed we should imediately unsubscribe the chain
        if (!this.closed) {
            // produce an observer (using subscriber like check for instances passed as next)
            const subscriber = (next && next.observer ? next : new Subscriber(next, error, complete, unsubscribe));
            // record the observers if its not already recorded and this subject isnt in stopped state (complete called on source)
            if (!subscriber.isStopped) {
                // record the observer and associate a teardown to reverse the subscription
                this.observers.push(subscriber);
                // this is the equivalent of the SubjectSubscription behaviour
                subscriber.add(() => {
                    // drop the Subscriber(Observer or Subject) from the Subject
                    this.observers.splice(this.observers.indexOf(subscriber), 1);
                });
                // mark the subscription (nooped if subscription closed before returning)
                const subscription = super.subscribe(subscriber);
                // call to complete when the source was complete before we subscribed
                if (this.isStopped && !this.closed && !subscriber.isStopped) subscription.complete();
                // if (this.isStopped && !this.closed && !subscriber.isStopped) subscription.complete();

                // return the subscription instance returned from Observable
                return subscription;
            }
        } else {
            // check if the observer we're subscribing is provided as Observer like
            if (next && next.unsubscribe) {
                // complete the observer like construct
                next.unsubscribe();
            } else {
                // construct observer so that we can call Observer.unsubscribe method
                const observer = new Subscriber(next, error, complete, unsubscribe);
                // call to complete (was never subscribed so no additional cleanup required)
                observer.unsubscribe();
            }
        }
    }

    // iterates on this.observers and calls the next method on each
    next(data) {
        // when in the stopped state no new messages should be pushed
        if (!this.isStopped) {
            // message inner subscriptions on message from source 
            // (concatting here stops completions dropping elements from the working observers set *still dropped from this.observers)
            this.observers.concat().forEach(observer => {
                // check for closing/closed state on the observer itself
                observer.next(data);
            });
        }
    }

    // iterates on this.observers and calls the error method on each observer.
    error(e) {
        // error and complete once per invoke
        if (!this.isStopped) {
            // stop the subject following an error
            this.isStopped = true;
            // error inner subscriptions on error of source
            this.observers.concat().forEach(observer => {
                // throw the error through the subscriber
                observer.error(e);
            });
            // record the last failed attempt and stop future calls
            this._error = e;
        }
    }

    // iterates on this.observers and calls the complete method on each observer.
    complete() {
        // complete once per invoke
        if (!this.isStopped) {
            // mark as stopped
            this.isStopped = true;
            // complete inner subscriptions on complete of source
            this.observers.concat().forEach(observer => {
                // complete then unsubscribe (unsubscribe is handled internally by Observer)
                observer.complete();
            });   
        }
    }
    
    // iterates on this.observers and calls the unsubscribe method on each observer.
    unsubscribe() {
        // only perform unsubscribe once per invoke
        if (!this.closed) {
            // stop future calls (after this unsubscribe has been emitted if it wasnt sourced from a complete);
            this.closed = (this.isStopped ? this.closed : true);
            // always mark as stopped
            this.isStopped = true;
            // drop outer subscription on end of observers
            this.observers.concat().forEach(observer => {
                // allow the Observer to unsubscribe by its own terms
                observer.unsubscribe();
            });
        }
    }
}