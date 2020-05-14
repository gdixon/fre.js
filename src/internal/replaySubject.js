
// extending Subject to include lastMessage
import { Subject } from "./subject.js";

// Schedule the removal of messages from the buffer if windowTime is present
import { Queue } from "./scheduler/singleton/queue.js";

// A BehaviorSubject is a Subject which retains its last message and emits it to any new Observers on subscribe
export class ReplaySubject extends Subject {

    // static method to create a new observable
    static create(bufferSize, windowTime, scheduler, options) {

        // straight pass through to the constructor
        return new ReplaySubject(bufferSize, windowTime, scheduler, options);
    }

    // subject has observers and an update method and retains the lastMessage so that new subscriptions receive it immediately
    constructor(bufferSize, windowTime, scheduler, options) {
        // default the options set
        options = (options || {});
        // super with no subscriber
        super(options);
        // instantiate an empty array to store the buffer
        this.buffer = [];
        // forward the bufferSize (how many messages to hold against the Replay state)
        this.bufferSize = bufferSize;
        // number in ms of when the buffered message should retire (if not already removed by bufferSize restraints)
        this.windowTime = windowTime;
        // place the provided scheduler into the options
        this.scheduler = scheduler;
    }

    // set up the publisher to send the buffered messages on subscribe
    _publisher(observer) {
        // grab the current before before subscribing
        const buffer = this.buffer.concat();
        // send each message from the buffer to the observer
        buffer.forEach((buffered) => observer.next(buffered.message));
    }

    // iterates on this.observers and calls the update method on each observer.
    next(message) {
        // dont emit messages if the subject itself was unsubscribed
        if (!this.closed) {
            // local ref to the buffer
            const {buffer} = this;
            // create a object to hold the message so we can find it by reference later
            const bufferMessage = {"message" : message};
            // pick the scheduler (provided on construct or default to Aysnc)
            const scheduler = (this.scheduler || Queue);
            // record the replays up to the maximum bufferSize by dropping items from the start if the bufferSize is reached
            if (this.bufferSize && buffer.length == this.bufferSize) buffer.shift();
            // load up the buffer with messages from the source
            buffer.push(bufferMessage);
            // only set clean up if windowTime is provided
            if (scheduler && typeof this.windowTime !== "undefined") {
                // schedule the removal of the buffered message - check for schedule or default to AsyncScheduler
                scheduler.schedule(function() {
                    // if the message is present splice it from the buffer
                    if (buffer.indexOf(bufferMessage) !== -1) buffer.splice(buffer.indexOf(bufferMessage), 1);
                }, true, this.windowTime);
            }

            // then in all other places
            super.next(message);
        }
    }
}