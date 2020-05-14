// base scheduler
import { Scheduler } from "../scheduler.js";

// passing the queue via a static method allows us to delay the creation of a scheduler for a given context until run time
export class AsyncScheduler extends Scheduler {

    constructor(action) {
        // set-up instances construct
        super(action);
        // during a flush we should manage active state so that we know whether to invoke or collect
        this.active = false;
        // queue the actions into a flushable chain
        this.actions = [];
    }

    // flush any delays so that we can catch errors and cancel scheduled actions
    flush(action) {
        // localise actions
        const { actions } = this;
        // during the active flush phase record the actions (we only need to use flush if queueing without delay)
        if (this.active) {
            // record every action
            actions.push(action);

            // and only record --- exit early
            return;
        }
        // mark as active
        this.active = true;
        // recursively solve the actions
        let error = (function inner(_action, _error){
            // set state of the internal error tracking by executing the action (each tick)
            _error = (_action && _action.exec(_action.state, _action.delay));

            // execute the actions recursively (if executing an action adds an action...)
            return (_error ? 
                // if running the current action error'd stop and throw
                _error :  (
                    // when the initial action call queued another - call inner again....
                    actions.length > 0 ? inner.call(this, actions.shift()) : 
                        // else return undf so we dont enter the error logic
                        undefined
                )
            );
        }).call(this, action);
        // no longer actively collecting actions
        this.active = false;
        // if there was an error we can drop all the actions - but they need to be cleared of int
        if (error) {
            // actions will clear themselves from actions on unsubscribe so protect collection with concat
            while ((action = actions.shift())) action.unsubscribe();
            // manage the error in the implementor
            throw error;
        }
    }
}