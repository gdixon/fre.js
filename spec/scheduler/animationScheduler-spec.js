// import chai for testing
import chai from 'chai';
// sinon is used to stub timers (for set(Interval/Timeout))
import sinon from 'sinon';

// const AnimationScheduler = require("../../src/fre/scheduler/singleton/animation.js");
import { Animation as AnimationScheduler } from "../../src/internal/scheduler/singleton/animation.js";

// mock-raf is a testing stub for requestAnimationFrame && cancelAnimationFrame
var createMockRaf = require('mock-raf');
var mockRaf = createMockRaf();
// needs placing into the global object so its used in place of window.*
global.requestAnimationFrame = mockRaf.raf;
global.cancelAnimationFrame = mockRaf.cancel;

describe("fre AnimationScheduler functionality", function() {

    // set-up spec testing feature-set
    it("should act like the async scheduler if delay > 0", function (done) {
        // initial value to tap against (working like reduce)
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        AnimationScheduler.schedule(function () {
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

    it('should schedule an action to happen later', function (done) {

        let actionHappened = false;
        // schedule an action and step raf immediately
        AnimationScheduler.schedule(function () {
            actionHappened = true;
            // finished
            done();
        });
        // stepping will cause the task to be established and complete asynchronously
        if (actionHappened) {
            done(new Error('Scheduled action happened synchronously'));
        }
        // stepping raf
        mockRaf.step({ count: 1 });
    });

    it('should cancel animationFrame actions when unsubscribed', function (done) {
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        const action = AnimationScheduler.schedule(function () {
            actionHappened = true;
        }, true, 50);
        // teardown the schedule
        action.unsubscribe();
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        sandbox.restore();
        // finished
        done();
    });

    it('should execute recursively scheduled actions in separate asynchronous contexts', (done) => {
        let syncExec1 = true;
        let syncExec2 = true;
        AnimationScheduler.schedule(function (index) {
            if (index === 0) {
                this.schedule(1);
                AnimationScheduler.schedule(() => { syncExec1 = false; });
            } else if (index === 1) {
                this.schedule(2);
                AnimationScheduler.schedule(() => { syncExec2 = false; });
            } else if (index === 2) {
                this.schedule(3);
            } else if (index === 3) {
                if (!syncExec1 && !syncExec2) {
                    // finished
                    done();
                } else {
                    done(new Error('Execution happened synchronously.'));
                }
            }
            mockRaf.step({ count: 1 });
        }, 0, 0);
        mockRaf.step({ count: 1 });
    });

    it('should execute all actions held on tick', (done) => {
        // ensure this state remains false
        let animationFrameExec1 = false, animationFrameExec2 = false;
        chai.expect(AnimationScheduler.actions.length).to.equal(0);
        // schedule two tasks to the frame
        AnimationScheduler.schedule(function () { animationFrameExec1 = true; }, true);
        AnimationScheduler.schedule(function () { animationFrameExec2 = true; }, true);
        // expect the actions to be scheduled
        chai.expect(AnimationScheduler.scheduled).to.exist;
        chai.expect(AnimationScheduler.actions.length).to.equal(2);
        // schedule and tick another action to ensure the first are cleared
        AnimationScheduler.schedule(function () {
            chai.expect(animationFrameExec1).to.equal(true);
            chai.expect(animationFrameExec2).to.equal(true);
            // finished
            done();
        }, true);
        // step
        mockRaf.step({ count: 1 });
    });

    it('should cancel tick following an error', (done) => {
        try {
            // schedule two tasks to the frame
            AnimationScheduler.schedule(function () { throw("error"); }, true);
            AnimationScheduler.schedule(function () { done("Error failed to cancel schedule"); }, true);
            // expect the actions to be scheduled
            chai.expect(AnimationScheduler.scheduled).to.exist;
            chai.expect(AnimationScheduler.actions.length).to.equal(2);
            // doesnt catch till mockRaf?
            mockRaf.step({ count: 1 });
        } catch (e) {
            // catch the error thrown by the schedule
            chai.expect(e).to.equal("error");
            // finished
            done();
        }
    });

    it('should cancel the animation frame if all scheduled actions unsubscribe before it executes', (done) => {
        // ensure this state remains false
        let animationFrameExec1 = false, animationFrameExec2 = false;
        chai.expect(AnimationScheduler.actions.length).to.equal(0);
        // schedule two tasks to the frame
        const action1 = AnimationScheduler.schedule(function () { animationFrameExec1 = true; }, true);
        const action2 = AnimationScheduler.schedule(function () { animationFrameExec2 = true; }, true);
        // expect the actions to be scheduled
        chai.expect(AnimationScheduler.scheduled).to.exist;
        chai.expect(AnimationScheduler.actions.length).to.equal(2);
        // drop the subscriptions
        action1.unsubscribe();
        action2.unsubscribe();
        // after clearing - actions is empty and scheduled is cleared
        chai.expect(AnimationScheduler.actions.length).to.equal(0);
        chai.expect(AnimationScheduler.scheduled).to.equal(undefined);
        // schedule and tick another action to ensure the first are cleared
        AnimationScheduler.schedule(function () {
            chai.expect(animationFrameExec1).to.equal(false);
            chai.expect(animationFrameExec2).to.equal(false);
            // finished
            done();
        }, true);
        // step
        mockRaf.step({ count: 1 });
    });

    it('should execute the rest of the scheduled actions if the first action is canceled', (done) => {
        let actionHappened = false;
        let secondSubscription = false;

        const firstSubscription = AnimationScheduler.schedule(() => {
            actionHappened = true;
            if (secondSubscription) {
                secondSubscription.unsubscribe();
            }
            done(new Error('The first action should not have executed.'));
        });

        secondSubscription = AnimationScheduler.schedule(() => {
            if (!actionHappened) {
                // finished
                done();
            }
        });

        if (actionHappened) {
            done(new Error('Scheduled action happened synchronously'));
        } else {
            firstSubscription.unsubscribe();
        }

        mockRaf.step({ count: 1 });

    });
});
