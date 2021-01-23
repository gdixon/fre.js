// polyfill the generator method if absent from runtime
import "core-js/stable";
import "regenerator-runtime/runtime"

// import chai for testing
import chai from 'chai';
// import sinon for mocking timers
import sinon from 'sinon';
// FromArray to create a new Observable for each test
import { FromIterable, Async } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";

// set-up spec testing feature-set
describe("fre Observable/FromIterable functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the FromIterable method from Observable using generator", function (done) {
        // fromObservable also accepts a generator-like method and exhausts it
        function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {

                yield i;
            }
        }
        // carry out a filter on the subject
        const resultOfCallback = FromIterable(generatorFunction(1, 4)).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            done(e)
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    it("should carry-out the FromIterable method from Observable using generator and Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false;
        // fromObservable also accepts a generator-like method and exhausts it
        function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {

                yield i;
            }
        }
        // carry out a filter on the subject
        const resultOfCallback = FromIterable(generatorFunction(1, 4), Async).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((m) => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, (e) => {
            // throw on error;
            done(e);
        }, () => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, () => {
            chai.expect(actionHappened).to.equal(true);
            // finsihed with done]
            done();
        });
    });

    it("should be catch errors from producer when created using Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false, errorHappened = false, actionCompleted = false;
        // fromObservable also accepts a generator-like method and exhausts it
        function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {
                if (i === 2) throw("deliberate error")
                yield i;
            }
        }
        // carry out a filter on the subject
        const resultOfCallback = FromIterable(generatorFunction(1, 4), Async).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe(() => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, (e) => {
            // check error content
            chai.expect(e).to.equal("deliberate error");
            // mark the action (it shouldnt happen)
            errorHappened = true;
        }, () => {
            actionCompleted = true;
        }, () => {
            // only error and unsubscribe happen if the generator throws
            chai.expect(errorHappened).to.equal(true);
            chai.expect(actionHappened).to.equal(false);
            chai.expect(actionCompleted).to.equal(false);
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
        // fromObservable also accepts a generator-like method and exhausts it
        function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {
                // if (i === 2) throw("deliberate error")
                yield i;
            }
        }
        // carry out a filter on the subject
        const backToArray = FromIterable(generatorFunction(1, 4), Async).pipe(toArray());
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

    // set-up spec testing feature-set
    it("should throw error if provided !iterable", function (done) {
        // carry out a filter on the subject
        const backToArray = FromIterable(1).pipe(toArray()), messages = [];
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            // record the message
            messages.push(message);
            // completes but with no messages
            chai.expect(JSON.stringify(message)).to.equal("[]");
        }, (e) => {
            // expect type error
            chai.expect(e).to.equal("FromIterable must be provided iterable primitive");
            // ensure no messages were delivered
            chai.expect(messages.length).to.equal(0);
            // finsihed with done]
            done();
        });
    });

});
