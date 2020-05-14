// export a singleton of AsapScheduler
import { AsapScheduler } from "../asapScheduler.js";
// AsapScheduler flushes AsapAction instances against the scheduler
import { AsapAction } from "../action/asapAction.js";

// singleton
export const Asap = new AsapScheduler(AsapAction);