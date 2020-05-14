// import chai for testing
import chai from 'chai';
// sinon is used to stub timers (for set(Interval/Timeout))
import sinon from 'sinon';
// const AsyncScheduler = require("../../src/fre/scheduler/singleton/async.js");
import { Async as AsyncScheduler } from "../../src/internal/scheduler/singleton/async.js";

describe("fre AsyncScheduler functionality", function() {

    // set-up spec testing feature-set
    it("should allow for delays", function (done) {
        // initial value to tap against (working like reduce)
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        AsyncScheduler.schedule(function () {
            actionHappened = true;
        }, true, 50);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.true;
        sandbox.restore();
        // finsihed with done
        done();
    });

    it("should allow schedule to cancel by rescheduling with false", function (done) {
        // initial value to tap against (working like reduce)
        let called = 0;
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        AsyncScheduler.schedule(function (state) {
            called++;
            actionHappened = true;
            // cancel future schedules
            this.schedule(false);
        }, true, 50);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.true;
        fakeTimer.tick(100);
        // even though we rescheduled - setting state to fales clears the schedule?
        chai.expect(called).to.equal(1);
        sandbox.restore();
        // finsihed with done
        done();
    });

    it('should execute all scheduled actions on tick (each action has seperate timer mechanism', (done) => {
        // ensure this state remains false
        let asyncExec1 = false, asyncExec2 = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // schedule two tasks to the frame
        AsyncScheduler.schedule(function () { asyncExec1 = true; }, true);
        AsyncScheduler.schedule(function () { asyncExec2 = true; }, true);
        // schedule and tick another action to ensure the first are cleared
        AsyncScheduler.schedule(function () {
            chai.expect(asyncExec1).to.equal(true);
            chai.expect(asyncExec2).to.equal(true);
        }, true);
        // emit a tick
        fakeTimer.tick(1);
        sandbox.restore();
        // finished
        done();
    });

    it('should cancel tick following an error', (done) => {
        // ensure this state remains false on 1 and moves to true on 2
        let action2 = null;
        // fake the time to settle async
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // schedule two tasks to the frame
        const action1 = AsyncScheduler.schedule(function () { 
            // start the second subscription inside the flushed worker
            action2 = this.schedule(function () { done("Error failed to cancel schedule") }, true);
            // throw after setting up the scheduled work
            throw("error"); 
        }, true);
        // catch error raised through the promise at resolve
        try {
            fakeTimer.tick(1);
        } catch (e) {
            // first action is closed
            chai.expect(action1.closed).to.equal(true);
            chai.expect(action2.closed).to.equal(true);
            // reschedule closed
            action1.schedule(function () { 
                done("should skip if closed")
            }, true);
            // catch the error thrown by the schedule
            chai.expect(e).to.equal("error");
            // restore the sandbox
            sandbox.restore();
            // finished
            done();
        };
    });
});
