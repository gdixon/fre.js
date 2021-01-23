// extend from an AysncAction --- The queue uses Aysnc for delayed work
import { AsyncAction } from "./asyncAction.js";

// create a AsyncAction which will queue operations on to the macrotask queue using setInterval (even if no delay is present)
export class AnimationAction extends AsyncAction {

    // Action will be provided to a Scheduler
    constructor(scheduler, work) {
        // build an AysncAction to handle delays
        super(scheduler, work);
    }

    _register() {
        // move to parent if delay is present
        if (this.delay) return super._register();
        // push the action to the end of the scheduler queue
        this.scheduler.actions.push(this);

        // return the currently assigned animationFrame id or request a new frame (to flush actions)
        return this.scheduler.scheduled || (this.scheduler.scheduled = requestAnimationFrame(() => { return this.scheduler.flush(undefined);}));
    }

    _recycle (delay) {
        // move to parent if delay is present
        if (this.delay) return super._recycle(delay);
        // when the schedulers actions are all removed - cancel the frame
        if (this.id && this.pending === false && this.scheduler.actions.length === 0) {
            // cancel the frame
            cancelAnimationFrame(this.id); 
            // remove scheduled markings
            this.scheduler.scheduled = undefined;
        }

        return undefined;
    }
}