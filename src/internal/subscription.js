// calling unsubscribe on any Subscriptionlike should dispose of the teardowns and close the connection to source finalising with constructor fed unsubscribe method
export class Subscription {

    // static method to create a new Subscription
    static create(unsubscribe) {

        // straight pass through to the constructor
        return new Subscription(unsubscribe);
    }

    // created as response of .subscribe() on an Observable
    constructor(unsubscribe) {
        // subscription stands until unsubscribed
        this.closed = false;
        // register isStopped to mark completion (if isStopped is marked before unsubscribe - we dont mark closed = true)
        this.isStopped = false;
        // construct a store for teardowns
        this._teardowns = [];
        // record the given unsub method
        this._unsubscribe = unsubscribe;
    }

    // add a teardown (any type)
    add(teardown) {
        // check for closed state first - if we're in it - run immediately
        if (!this.closed) {
            // record the teardowns in the order given - first in last out
            if (teardown && !teardown.isStopped && this._teardowns.indexOf(teardown) == -1) this._teardowns.push(teardown);

            // returns a closure to the remove method with teardown in place
            return () => {

                // teardown teardown
                return this.remove(teardown);
            };
        } else {
            // dispose of the new teardown immediately
            Dispose([teardown]);
        }
    }

    // remove a teardown
    remove(teardown) {
        // only when the teardown exists in _teardowns
        if (this._teardowns.indexOf(teardown) !== -1) return this._teardowns.splice(this._teardowns.indexOf(teardown), 1);
    }

    // unsubscribe will instrument disposal of teardowns and finalise by calling the constructor provided _unsubscribe method
    unsubscribe(closed) {
        // check for source and observer
        if (!this.closed) {
            // mark as stopped
            this.isStopped = true;
            // check if we're providing the desired closed state via arg (if the Observer completes before it unsubscribes then this.closed will === false)
            this.closed = (typeof closed !== "undefined" ? closed : true);
            // dispose of the teardowns only when the state holds teardowns...
            if (this._teardowns && this._teardowns.length > 0) {
                // call each teardown method and remove from log
                Dispose(this._teardowns);
            }
            // run the given finalise method after tearing down
            if (this._unsubscribe) this._unsubscribe.call();
        }
    }
}

// carry out the teardown logic on the provided array
const Dispose = function (teardowns) {
    // take each item from teardowns and record in to teardown ready to be invoked
    let teardown = false;
    // iterate the collection and clear all teardowns (while teardowns are present)
    while (teardowns && teardowns.length > 0 && (teardown = teardowns.splice(0, 1)[0])) {
        // when a subscription is given - check for empty state before unloading
        if (teardown && teardown instanceof Subscription) {
            // call out to the unsubscribe method immediately
            teardown.unsubscribe();
        } else if (teardown && (typeof teardown == "function" || typeof teardown.call === "function")) {
            // if the teardown is either a function or an object with a call method then call()
            teardown.call(this, teardowns);
        } else if (teardown && Array.isArray(teardown)) {
            // teardown each item in the array (recursively if necessary)
            Dispose(teardown);
        }
    }
};