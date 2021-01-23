

// create a AsyncAction which will queue operations on to the macrotask queue using setInterval (even if no delay is present)
export class AsyncAction {

    constructor(scheduler, work) {
        // records ctx as scheduler
        this.scheduler = scheduler;
        // method to be executed (optionally recursivly)
        this.work = work;
        // record the interval so that it can be cleared between schedules
        this.id = false;
    }

    _register() {

        // if the id is already present then reuse otherwise create new by setting an Interval which flushes the scheduler with this action
        return this.id || setInterval(this.scheduler.flush.bind(this.scheduler, this), this.delay);
    }

    _recycle(delay) {
        // if delay is still the same and this is being called synchronously we can reuse the same Interval
        if (typeof delay !== "undefined" && this.delay === delay && this.pending === false) {
        
            return this.id;
        }
        // in all other situations we should clear the timer
        if (this.id) clearInterval(this.id);
    }

    schedule(state, delay) {
        // dissallow closed actions from being rescheduled
        if (this.closed) return this;
        // either retain or clear the previously set interval
        this.id = this._recycle(delay);
        // mark as pending so we can track rescheduled events
        this.pending = true;
        // set the actions state
        this.state = state;
        this.delay = delay;
        // initiate the interval (providing the action doesnt still/already have one associated)
        this.id = this._register();

        // returns action on schedule (allowing for calls to .unsubscribe to cancel actions)
        return this;
    }

    exec(state, delay) {
        // pending moves to false when work is attempted (at flush)
        this.pending = false;
        // call out to the internal work
        const error = this._exec(state, delay);
        // return and break on error
        if (error) return error;
        // clear the timer if not rescheduled sychronously
        if (this.pending === false && typeof this.id !== "undefined") {
            // allow for rescheduling by not unsubscribing (but still forces clearInternval)
            this.id = this._recycle();
        }
    }

    _exec(state, delay) {
        // record the state
        this.state = state;
        // record the delay
        this.delay = delay;
        // stop handling work if state is ever falsy
        if (this.state !== false && this.work) {
            try {
                // attempt the work
                this.work.call(this, state);
            } catch (e) {
                // drop this subscription - the rest of the schedule will be cleared by the flush
                this.unsubscribe();

                // return the error into the flush
                return e;
            }
        }
    }

    unsubscribe() {
        // remove the action from the actions array in scheduler
        if (this.scheduler.actions.indexOf(this) !== -1) this.scheduler.actions.splice(this.scheduler.actions.indexOf(this), 1); 
        // clear the state
        this.pending = false;
        // unsubscribes via recycle - we clear when pending is false
        this.id = this._recycle();
        // clear state
        this.work = undefined;
        this.delay = undefined;
        // stop future attempts of rescheduling
        this.closed = true;
    }

}
