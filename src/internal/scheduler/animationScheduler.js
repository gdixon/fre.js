// async over base scheduler
import { AsyncScheduler } from "./asyncScheduler.js";

// passing the queue via a static method allows us to delay the creation of a scheduler for a given context until run time
export class AnimationScheduler extends AsyncScheduler {

    // flush any delays so that we can catch errors and cancel scheduled actions
    flush(action) {
        // retrieve actions
        const { actions } = this;
        // mark as active
        this.active = true;
        // clear the scheduled
        this.scheduled = undefined;
        // grab the first action if not supplied by flush
        action = action || actions.shift();
        // only perform inner for whats in the actions at the start of the flush (no reshedules)
        let index = 0, length = actions.length;
        // recursively solve the actions
        let error = (function inner(_action, _error) {
            // set state of the internal error tracking by executing the action (each tick)
            _error = (_action && _action.exec(_action.state, _action.delay));

            // execute the actions recursively (if executing an action adds an action...)
            return (_error ? 
                // if running the current action error'd stop and throw
                _error : (
                    // when the queue still has actions ... call inner again....
                    ((index++) < length) ? inner.call(this, (action = actions.shift())) : undefined
                )
            );
        }).call(this, action);
        // no longer actively collecting actions
        this.active = false;
        // if there was an error we can drop all the actions - but they need to be cleared of int
        if (error) {
            // clear out any future actions cancelled by the error
            while ((index++) < length && (action = actions.shift())) action.unsubscribe();
            // manage the error in the implementor
            throw error;
        }
    }
}
