// export a singleton of QueueScheduler
import { QueueScheduler } from "../queueScheduler.js";
// QueueScheduler flushes QueueAction instances against the scheduler
import { QueueAction } from "../action/queueAction.js";

// singleton
export const Queue = new QueueScheduler(QueueAction);