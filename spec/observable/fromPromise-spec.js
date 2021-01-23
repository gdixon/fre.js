// import chai for testing
import chai from 'chai';
// FromPromise to create a new Observable for each test
import { FromPromise, Async } from "../../src/fre.js";

// set-up spec testing feature-set
describe("fre Observable/FromPromise functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the fromPromise method from Observable", function (done) {
        // test for completion
        let completed = false;
        // carry out a filter on the subject
        const resultOfPromise = FromPromise(new Promise((resolve) => resolve([1,2,3,4])));
        // place a subscription carry out the work
        resultOfPromise.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            done(e)
        }, () => {
            completed = true;
        }, function () {
            // expect complete to be called
            chai.expect(completed).to.equal(true);
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the FromPromise method from Observable and fail", function (done) {
        // carry out a filter on the subject
        const resultOfPromise = FromPromise(new Promise(() => {
            // dummy a fail case
            throw("exception");
        }));
        // place a subscription carry out the work
        resultOfPromise.subscribe(undefined, (e) => {
            // carries the error through
            chai.expect(e).to.equal("exception");
        }, () => {
            done("completed and shouldnt have");
        }, function () {
            // finsihed with done]
            done();
        });
    });

    it("should carry-out the FromPromise method from Observable using Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false, actionCompleted = false;
        // carry out a filter on the subject
        const resultOfPromise = FromPromise(new Promise((resolve) => resolve([1,2,3,4])), Async);
        // place a subscription carry out the work
        resultOfPromise.subscribe((m) => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, (e) => {
            // throw on error;
            done(e);
        }, () => {
            // mark the action (it shouldnt happen)
            actionCompleted = true;
        }, () => {
            chai.expect(actionHappened && actionCompleted).to.equal(true);
            // finsihed with done]
            done();
        });
    });


});
