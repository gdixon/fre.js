// polyfill the generator method if absent from runtime
import "core-js/stable";
import "regenerator-runtime/runtime"

// import chai for testing
import chai from 'chai';
// import sinon for mocking timers (we cant user jasmine.clock here because Async has no delay - jasmine ticks with true(ish) ms boundary emits all in one tick)
import sinon from 'sinon';
// FromArray to create a new Observable for each test
import { FromArray, Async } from "../../src";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";

// set-up spec testing feature-set
describe("fre Observable/FromArray functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the fromArray method from Observable", function (done) {
        // carry out a filter on the subject
        const backToArray = FromArray([1,2,3,4]).pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });
    
    // set-up spec testing feature-set
    it("should carry-out the fromArray method from Observable using Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false;
        // mock the timer
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // carry out a filter on the subject
        const backToArray = FromArray([1,2,3,4], Async).pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            // mark the action
            actionHappened = true;
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
        // tick the time
        fakeTimer.tick(3);
        chai.expect(actionHappened).to.equal(false);
        fakeTimer.tick(1);
        chai.expect(actionHappened).to.equal(true);
        sandbox.restore();
    });
    
    // set-up spec testing feature-set
    it("should carry-out the fromArray method from Observable using generator", function (done) {
        // check for completion
        let completed = false;
        // fromObservable also accepts a generator-like method and exhausts it
        function * generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {
                yield i;
            }
        };
        // carry out a filter on the subject
        const backToArray = FromArray(generatorFunction(1, 4)).pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            // throw on error
            done(e);
        }, () => {
            completed = true;
        }, function () {
            // ensure the complete action was called
            chai.expect(completed).to.equal(true);
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should throw error if provided !iterable", function (done) {
        // carry out a filter on the subject
        const backToArray = FromArray(1).pipe(toArray()), messages = [];
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            // completes but with no messages
            chai.expect(JSON.stringify(message)).to.equal("[]");
        }, (e) => {
            // throw on error
            done(e);
        }, () => {
            // ensure no messages were delivered
            chai.expect(messages.length).to.equal(0);
            // finsihed with done]
            done();
        });
    });

    it("should be cancellable when created using Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false, actionUnsubscribed = true;
        // mock the timer
        const sandbox = sinon.createSandbox();
        const fakeTimer = sandbox.useFakeTimers();
        // carry out a filter on the subject
        const backToArray = FromArray([1,2,3,4], Async).pipe(toArray());
        // place a subscription carry out the work
        const sub = backToArray.subscribe(() => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, (e) => {
            // throw error;
            done(e);
        }, () => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, function () {
            actionUnsubscribed = true;
        });
        // start ticking
        fakeTimer.tick(2);
        // drop the subscription before the complete message is delivered
        sub.unsubscribe();   
        // action not called (no next and no complete)
        chai.expect(actionHappened).to.equal(false);
        // but unsubscribe is
        chai.expect(actionUnsubscribed).to.equal(true);
        // tick again to kill the scheduler (and to get to the point where action would have happened)
        fakeTimer.tick(2);
        // still no action
        chai.expect(actionHappened).to.equal(false);
        // restore dropping sinon
        sandbox.restore();
        // finsihed with done]
        done();
    });
});
