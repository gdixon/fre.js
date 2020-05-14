
// extending Subject to include lastMessage
import { Subject } from "./subject.js";

// A BehaviorSubject is a Subject which retains its last message and emits it to any new Observers on subscribe
export class BehaviourSubject extends Subject {

    // static method to create a new observable
    static create(initialValue, options) {

        // straight pass through to the constructor
        return new BehaviourSubject(initialValue, options);
    }

    // subject has observers and an update method and retains the lastMessage so that new subscriptions receive it immediately
    constructor(initialValue, options) {
        // super with no subscriber
        super(options);
        // keek track of the last message so that we can immediately send it to new subscriptions
        this._value = initialValue;
    }

    // set the publisher to emit the first value on subscribe
    _publisher(subscriber) {
        // immediately stream the last message to the new subscriber if not filtered by prev
        subscriber.next(this.getValue());
    }

    // retrieve the lastMesaage from function nests (message should never be a function itself)
    getValue() {
        // get the value
        let value = this._value;
        // settle value at runtime allowing for reflections of state via fn (this means we cant set functions as messages on the stream?)
        // while (typeof value == "function") value = getValue();

        // return the value
        return value;
    }
    
    // iterates on this.observers and calls the update method on each observer.
    next(message) {
        // a stopped stream sends/receives no new messages
        if (!this.isStopped) {
            // record the last message we emmited
            this._value = message;

            // then in all other places
            return super.next(message);
        }
    }
}