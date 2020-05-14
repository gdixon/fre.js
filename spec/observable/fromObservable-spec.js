// polyfill the generator method if absent from runtime
import "core-js/stable";
import "regenerator-runtime/runtime"

// import chai for testing
import chai from 'chai';
// FromObservable to create a new Observable for each test
import { FromObservable, Async } from "../../src";
// pipe the resultant stream to toArray to get a single testable output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/FromObservable functionality", function() {

    // set-up spec testing feature-set
    it("carry-out the fromObservable method from Observable using an Observable as input", function (done) {
        // carry out a filter on the subject
        const resultOfCallback = FromObservable(helpers.observableTimeout).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("carry-out the fromObservable method from Observable using an Observable that errors as input", function (done) {
        let actionHappened = false, errorHappened = false;
        // carry out a filter on the subject
        const resultOfCallback = FromObservable(helpers.observableError).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe(() => {
            // no action should be recorded
            actionHappened = true;
        }, (e) => {
            // error did happen...
            errorHappened = true;
            // expect an error
            chai.expect(e).to.equal("error");
        }, undefined, function () {
            // ensure the error was emitted - no messages delivered
            chai.expect(!actionHappened && errorHappened).to.equal(true);
            // finsihed with done]
            done();
        });
    });
    
    it("carry-out the fromObservable method from Observable using a generator as input", function (done) {
        let actionHappened = false, errorHappened = false;
        // fromObservable also accepts a generator-like method and exhausts it
        function * generatorFunction() {
            yield 1;
            yield 2;
            yield 3;
            yield 4;
        };
        // carry out a filter on the subject
        const resultOfCallback = FromObservable(generatorFunction()).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe(() => {
            // no action should be recorded
            actionHappened = true;
        }, (e) => {
            // error did happen...
            errorHappened = true;
            // expect an error
            chai.expect(e).to.equal("object is not observable");
        }, undefined, function () {
            // ensure the error was emitted - no messages delivered
            chai.expect(!actionHappened && errorHappened).to.equal(true);
            // finsihed with done]
            done();
        });
    });

    it("should carry-out the FromObservable method from Observable using Async scheduler", function (done) {
        // ensure the action happens after ticks (4 of them)
        let actionHappened = false, actionCompleted = false;
        // carry out a filter on the subject
        const resultOfCallback = FromObservable(helpers.observableTimeout, Async).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((m) => {
            // mark the action (it shouldnt happen)
            actionHappened = true;
        }, (e) => {
            // throw on error;
            done(e);
        }, () => {
            // mark the action (it shouldnt happen)
            actionCompleted = true;
        }, () => {
            // both message and complete were called
            chai.expect(actionHappened && actionCompleted).to.equal(true);
            // finsihed with done]
            done();
        });
    });


    it("should carry errors through to the Subscriber using Async scheduler", function (done) {
        // carry out a filter on the subject
        const resultOfCallback = FromObservable(helpers.observableError, Async).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((m) => {
            // throw on error;
            done("Message received on next when it shouldnt have been");
        }, (e) => {
            // expect an error
            chai.expect(e).to.equal("error");
        }, () => {
            // mark the action (it shouldnt happen)
            done("Completed when it shouldnt have been");
        }, () => {
            // finsihed with done]
            done();
        });
    });

});
