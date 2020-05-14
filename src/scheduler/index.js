
// Exports singletons for each scheduler type

// Uses the microtask queue (setInterval)
export { Async } from "../internal/scheduler/singleton/async.js";

// Uses the macrotask queue (promises)
export { Asap } from "../internal/scheduler/singleton/asap.js";

// Uses requestAnimationFrame to bundle actions
export { Animation } from "../internal/scheduler/singleton/animation.js";

// Queues synchronously
export { Queue } from "../internal/scheduler/singleton/queue.js";