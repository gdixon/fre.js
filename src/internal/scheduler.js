// dont allow any delay greater than...
const MaxSafeSignedInt = 2147483647;

// all schedulers extend Schedule inorder to build actions against given params
export class Scheduler {

    static now() { 

        return Date.now();
    }

    constructor(action, now) {
        // every scheduler will have an action
        this.action = action;
        // allow for the now method to be overiden/mocked...
        this._now = (now || Scheduler.now);
    }

    now() {

        // retun the result of internal now method
        return (typeof this._now == "function" ? this._now() : this._now);
    }

    args(target, ...args) {

        // place the given arguments to context dependent on type and whats already set
        return Object.assign(target, args.reduce((ctx, arg) => {
            // placing arg based on type and position in argument list
            if (typeof ctx.work == "undefined" && typeof arg == "function") {
                ctx.work = arg;
            } else if (typeof ctx.delay == "undefined" && typeof arg == "number") {
                ctx.delay = arg;
            } else {
                ctx.state = arg;
            }

            return ctx;
        }, {}));
    }

    schedule(...args) {
        // read the args to ctx
        args = this.args({}, ...args);

        // dont schedule any messages that wont fit into 32bit signed int because it breaks timeout (68 years of delay in js is a bit hopeful anyway)
        return (!args.delay || args.delay < MaxSafeSignedInt ? (new this.action(this, args.work)).schedule(args.state, args.delay) : false);
    }
}