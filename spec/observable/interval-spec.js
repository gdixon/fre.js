// import chai for testing
import chai from 'chai';
// import sinon for mocking timers
import sinon from 'sinon';
// Interval to create a new Observable for each test
import { Interval, Queue } from "../../src";
// import toArray to finalise tests to one output
import { toArray, takeWhile } from "../../src/operator";

// set-up spec testing feature-set
describe("fre Observable/Interval functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the interval method from Observable", function (done) {
        // check the state on completion
        let actionHappened = false, completed = false;
        // carry out a filter on the subject
        const intervalled = Interval(1).pipe(takeWhile((m) => m <= 4), toArray());
        // place a subscription to carry out the work
        intervalled.subscribe((message) => {
            // mark the first action happened and ensure the message matches expectation
            actionHappened = true;
            chai.expect(JSON.stringify(message)).to.equal("[0,1,2,3,4]");
        }, (e) => {
            // throw any errors
            done(e)
        }, () => {
            completed = true;
        }, () => {
            // message and complete called
            chai.expect(actionHappened && completed).to.equal(true);
            // finsihed with done]
            done();
        });
       
    });

    it("should carry-out the interval method from Observable and Schedule against provided Scheduler", function (done) {
        // check the state on completion
        let actionHappened = false, completed = false;
        // mock the timer
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // carry out a filter on the subject
        const intervalledWithScheduler = Interval(1, Queue).pipe(takeWhile((m) => m <= 4), toArray());
        // place a subscription to carry out the work
        intervalledWithScheduler.subscribe((message) => {
            // mark the second action happened and ensure the message matches expectation
            actionHappened = true;
            chai.expect(JSON.stringify(message)).to.equal("[0,1,2,3,4]");
        }, (e) => {
            // throw any errors
            done(e)
        }, () => {
            // test completion
            completed = true;
        }, () => {
            chai.expect(actionHappened && completed).to.be.true;
        });
        // expect the delay to happen after appropriate time (* note that intervals start after first delay so 6 ticks to get 5 outputs)
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.be.false;
        fakeTimer.tick(1);
        chai.expect(actionHappened && completed).to.be.true;
        // tick again - scheduler will see that the Subscriber completed and cancel the schedule
        fakeTimer.tick(1);
        // drop sinon timer mock
        sandbox.restore();
        // finsihed with done]
        done();
    });
    
});
