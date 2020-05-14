// export a singleton of AnimationScheduler
import { AnimationScheduler } from "../animationScheduler.js";
// AnimationScheduler flushes AnimationAction instances against the scheduler
import { AnimationAction } from "../action/animationAction.js";

// singleton
export const Animation = new AnimationScheduler(AnimationAction);