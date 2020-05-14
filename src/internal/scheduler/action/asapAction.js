// extend the AsyncQueue with a path to take for !delay to process work on to the microtask queue (promises)
import { AsyncAction } from "./asyncAction.js";

// mark the then's with a global autoIncr so that we can find them after binding
let nextHandle = 1;
// record handles as we make them
const activeHandles = {};

// delete the promise ref point the took
function findAndClearHandle(handle) {
    // check that the handle is present... is this es5 compatible?
    if (handle && handle in activeHandles) {
        // remove the handle
        delete activeHandles[handle];

        // handle was found and removed - call work
        return true;
    }

    // if the handle was not found we should call the work
    return false;
}

// create an AsapAction which will queue an operation onto the microtask queue (macrotask queue with setInterval if delay is present)
export class AsapAction extends AsyncAction {

    constructor(scheduler, work) {
        // build an AysncAction to handle delays
        super(scheduler, work);
        // register the promise
        this.promise = Promise.resolve();
    }

    _register() {
        // move to parent if delay is present
        if (this.delay) return super._register();
        // Push the action to the end of the scheduler queue.
        this.scheduler.actions.push(this);
        
        // carry out promise work against a single promise per scheduler
        return this.scheduler.scheduled || (this.scheduler.scheduled = ((handle) => {
            // register handle
            activeHandles[handle] = true;
            // clean up and flush 
            this.promise = this.promise.then(() => findAndClearHandle(handle) && this.scheduler.flush.call(this.scheduler, undefined));

            // return handle position
            return handle;
        })(nextHandle++));
    }

    _recycle(delay) {
        // move to parent if delay is present
        if (this.delay) return super._recycle(delay);
        // clean up the handle - associated to all sharing the scheduled association to resolved
        if (typeof this.id !== "undefined" && this.pending === false && this.scheduler.actions.length === 0) {
            // allow for rescheduling by not unsubscribing
            findAndClearHandle(this.id);
            // remove scheduled markings
            this.scheduler.scheduled = undefined;
        }

        return this.id;
    }
}