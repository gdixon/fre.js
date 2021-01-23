// import chai for testing
import chai from 'chai';
// sinon is used to stub timers (for set(Interval/Timeout))
import sinon from 'sinon';
// const QueueScheduler = require("../../src/fre/scheduler/singleton/queue.js");
import { Queue as QueueScheduler } from "../../src/internal/scheduler/singleton/queue.js";

describe("fre QueueScheduler functionality", function() {
        
    // set-up spec testing feature-set
    it("should act like the async scheduler if delay > 0", function (done) {
        // initial value to tap against (working like reduce)
        let actionHappened = false;
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        QueueScheduler.schedule(function () {
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


    it('should execute all actions held on tick', (done) => {
        // ensure this state remains false
        let asyncExec1 = false, asyncExec2 = false;
        // schedule two tasks to the frame
        QueueScheduler.schedule(function () { asyncExec1 = true; }, true);
        QueueScheduler.schedule(function () { asyncExec2 = true; }, true);
        // schedule and tick another action to ensure the first are cleared
        QueueScheduler.schedule(function () {
            chai.expect(asyncExec1).to.equal(true);
            chai.expect(asyncExec2).to.equal(true);
        }, true);
        // finished
        done();
    });

    it('should switch from synchronous to asynchronous at will', (done) => {
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
    
        let asyncExec = false;
        let state = [];
    
        QueueScheduler.schedule(function (index) {
        state.push(index);
        if (index === 0) {
            this.schedule(1, 100);
        } else if (index === 1) {
            asyncExec = true;
            this.schedule(2, 0);
        }
        }, 0, 0);
    
        chai.expect(asyncExec).to.be.false;
        chai.expect(state).to.be.deep.equal([0]);
    
        fakeTimer.tick(100);
    
        chai.expect(asyncExec).to.be.true;
        chai.expect(state).to.be.deep.equal([0, 1, 2]);
    
        sandbox.restore();

        // finished
        done()
    });

    it('should unsubscribe the rest of the scheduled actions if an action throws an error', (done) => {
        const actions = [];
        let action2Exec = false;
        let action3Exec = false;
        let errorValue = undefined;
        try {
            QueueScheduler.schedule(() => {
                actions.push(
                    QueueScheduler.schedule(() => { throw new Error('oops'); }),
                    QueueScheduler.schedule(() => { action2Exec = true; }),
                    QueueScheduler.schedule(() => { action3Exec = true; })
                );
            });
        } catch (e) {
            errorValue = e;
        }
        chai.expect(actions.every((action) => action.closed)).to.be.true;
        chai.expect(action2Exec).to.be.false;
        chai.expect(action3Exec).to.be.false;
        chai.expect(errorValue).exist;
        chai.expect(errorValue.message).to.equal('oops');

        // finished
        done()
    });
});
