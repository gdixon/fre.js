// treeshakable import of everything (shouldnt be any naming collisions)
export * from "./fre.js"; 

// Schedulers are singleton instances of *Scheduler
export * from "./scheduler/index.js";

// all Observable creators are Uppercase
export * from "./observable/index.js";

// all Operators are lower case (switch is aliased to switchFor to avoid naming collision with native switch)
export * from "./operator/index.js"; 