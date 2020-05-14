// import chai for testing
import chai from 'chai';
// sinon is used to stub timers (for set(Interval/Timeout))
import sinon from 'sinon';
// const AsapScheduler = require("../../src/fre/scheduler/singleton/asap.js");
import { Asap as AsapScheduler } from "../../src/internal/scheduler/singleton/asap.js";

describe("fre AsapScheduler functionality", function() {

    // set-up spec testing feature-set
    it("should act like the async scheduler if delay > 0", function (done) {
        // initial value to tap against (working like reduce)
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        AsapScheduler.schedule(function () {
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


    it('should cancel async actions when delay > 0', (done) => {
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        AsapScheduler.schedule(() => {
            actionHappened = true;
        }, 50).unsubscribe();
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(25);
        chai.expect(actionHappened).to.be.false;
        sandbox.restore();
        // finished
        done();
    });

    it('should reuse the interval for recursively scheduled actions with the same delay', (done) => {
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        const stubSetInterval = (sinon.stub(global, 'setInterval')).callThrough();
        const period = 50;
        const state = { index: 0, period: period };
        function dispatch(state) {
            state.index += 1;
            if (state.index < 3) {
                this.schedule(state, state.period);
            }
        }
        AsapScheduler.schedule(dispatch, period, state);
        chai.expect(state).to.have.property('index', 0);
        chai.expect(stubSetInterval).to.have.property('callCount', 1);
        fakeTimer.tick(period);
        chai.expect(state).to.have.property('index', 1);
        chai.expect(stubSetInterval).to.have.property('callCount', 1);
        fakeTimer.tick(period);
        chai.expect(state).to.have.property('index', 2);
        chai.expect(stubSetInterval).to.have.property('callCount', 1);
        stubSetInterval.restore();
        sandbox.restore();
        // finished
        done();
    });

    it('should not reuse the interval for recursively scheduled actions with a different delay', (done) => {
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        const stubSetInterval = (sinon.stub(global, 'setInterval')).callThrough();
        const period = 50;
        const state = { index: 0, period: period };
        function dispatch(state) {
            state.index += 1;
            state.period -= 1;
            if (state.index < 3) {
                this.schedule(state, state.period);
            }
        }
        AsapScheduler.schedule(dispatch, period, state);
        chai.expect(state).to.have.property('index', 0);
        chai.expect(stubSetInterval).to.have.property('callCount', 1);
        fakeTimer.tick(period);
        chai.expect(state).to.have.property('index', 1);
        chai.expect(stubSetInterval).to.have.property('callCount', 2);
        fakeTimer.tick(period);
        chai.expect(state).to.have.property('index', 2);
        chai.expect(stubSetInterval).to.have.property('callCount', 3);
        stubSetInterval.restore();
        sandbox.restore();
        // finished
        done();
    });

    it('should schedule an action to happen later', (done) => {
        let actionHappened = false;
        AsapScheduler.schedule(() => {
            actionHappened = true;
            // finished
            done();
        }, true);
        if (actionHappened) {
            done(new Error('Scheduled action happened synchronously'));
        }
    });

    it('should cancel the setImmediate if all scheduled actions unsubscribe before it executes', (done) => {
        let asapExec1 = false;
        let asapExec2 = false;

        const action1 = AsapScheduler.schedule(() => { asapExec1 = true; });
        const action2 = AsapScheduler.schedule(() => { asapExec2 = true; });
        chai.expect(AsapScheduler.scheduled).to.exist;
        chai.expect(AsapScheduler.actions.length).to.equal(2);
        action1.unsubscribe();
        action2.unsubscribe();
        chai.expect(AsapScheduler.actions.length).to.equal(0);
        chai.expect(AsapScheduler.scheduled).to.equal(undefined);
        AsapScheduler.schedule(() => {
            chai.expect(asapExec1).to.equal(false);
            chai.expect(asapExec2).to.equal(false);
            // finished
            done()
        });
    });


    it('should execute all actions held on tick', (done) => {
        // ensure this state remains false
        let asapExec1 = false, asapExec2 = false;
        chai.expect(AsapScheduler.actions.length).to.equal(0);
        // schedule two tasks to the frame
        AsapScheduler.schedule(function () { asapExec1 = true; }, true);
        AsapScheduler.schedule(function () { asapExec2 = true; }, true);
        // expect the action to be scheduled
        chai.expect(AsapScheduler.scheduled).to.exist;
        chai.expect(AsapScheduler.actions.length).to.equal(2);
        // schedule and tick another action to ensure the first are cleared
        AsapScheduler.schedule(function () {
            chai.expect(asapExec1).to.equal(true);
            chai.expect(asapExec2).to.equal(true);
            // finished
            done();
        }, true);
    });

    it('should cancel tick following an error', (done) => {
        // schedule two tasks to the frame
        const action1 = AsapScheduler.schedule(function () { throw ("error"); }, true);
        const action2 = AsapScheduler.schedule(function () { done("Error not throwing") }, true);
        // ensure both we're enqueued
        chai.expect(AsapScheduler.scheduled).to.exist;
        chai.expect(AsapScheduler.actions.length).to.equal(2);
        // catch error raised through the promise at resolve
        action1.promise.catch((e) => {
            // both actions closed
            chai.expect(action1.closed).to.equal(true);
            chai.expect(action2.closed).to.equal(true);
            // catch the error thrown by the schedule
            chai.expect(e).to.equal("error");
            // finished
            done();
        });
    });

    it('should execute the rest of the scheduled actions if the first action is canceled', (done) => {
        let actionHappened = false;
        let secondSubscription = null;

        const firstSubscription = AsapScheduler.schedule(() => {
            actionHappened = true;
            if (secondSubscription) {
                secondSubscription.unsubscribe();
            }
            done(new Error('The first action should not have executed.'));
        });

        secondSubscription = AsapScheduler.schedule(() => {
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
    });
});
