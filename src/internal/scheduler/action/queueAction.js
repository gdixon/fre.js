// extend from an AysncAction --- The queue uses Aysnc for delayed work
import { AsyncAction } from "./asyncAction.js";

// create a QueueAction which will queue an operation onto the synchronous queue (macrotask queue with setInterval if delay is present)
export class QueueAction extends AsyncAction {

    constructor(scheduler, work) {
        // build the AysncAction
        super(scheduler, work);
    }

    schedule(state, delay) {
        // check if we're delaying this message or not...
        if (!delay) {
            // place the state and flush
            this.state = state;
            // if no delay skip the exec stage (straight to _exec) - but still queue all messages via a flush
            this.scheduler.flush.call(this.scheduler, this);

            // bind unsub
            return this;
        } else {

            // delay and exec the chain straight away (we're already in queue order)
            return super.schedule(state, delay);
        }
    }

    exec(state, delay) {

        return (delay > 0 || this.closed) ? super.exec(state, delay) : this._exec(state, delay) ;
    }
 
}