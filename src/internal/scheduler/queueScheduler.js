// async over base scheduler
import { AsyncScheduler } from "./asyncScheduler.js";

// passing the queue via a static method allows us to delay the creation of a scheduler for a given context until run time
export class QueueScheduler extends AsyncScheduler {

    constructor(action) {
        super(action);
    }
}
