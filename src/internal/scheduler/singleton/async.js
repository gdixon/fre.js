// export a singleton of AsyncScheduler
import { AsyncScheduler } from "../asyncScheduler.js";
// AsyncScheduler flushes AsyncAction instances against the scheduler
import { AsyncAction } from "../action/asyncAction.js";

// singleton
export const Async = new AsyncScheduler(AsyncAction);