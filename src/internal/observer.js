// wraps methods making them safe to use as an Observer in the Observable.observer stack (handles closing completed Observations)
export class Observer {

    // static method to create a new observer
    static create(next, error, complete, unsubscribe) {

        // straight pass through to the constructor
        return new Observer(next, error, complete, unsubscribe);
    }

    // given an object at next or a complete signiture hydrate into Observer instance
    constructor(next, error, complete, unsubscribe) {
        // record the given methods (all optional) into the object itself (binding context)
        this._next = next;
        this._error = error;
        this._complete = complete;
        this._unsubscribe = unsubscribe;
        // initially open (Observers only have a closed state (no isStopped))
        this.closed = false;
    }

    // forward the message
    next(message) {
        if (!this.closed && this._next) this._next(message);
    }

    // * note that observers error should not call out to unsubscribe because it will be handled by the subscriber
    error(e) {
        if (!this.closed && this._error) this._error(e);
    }

    // call to the provided complete method 
    complete() {
        if (!this.closed && this._complete) this._complete();
    }

    // call to the provided unsubscribe method and close the Observer wrapper
    unsubscribe() {
        // unsubscribe should only be called once
        if (!this.closed) {
            // an Observer can only be closed/!closed (no isStopped state)
            this.closed = true;
            // unsubscribe will finalise an Observer - no new messages on any method after this point
            if (this._unsubscribe) {
                // try and catch any errors
                try {
                    // allow the Observer to unsubscribe by its own terms
                    this._unsubscribe();
                } catch (e) {
                    // push error through from here (which cant trigger unsubscribe again)
                    this._error(e);
                }
            }
        }
    }
}