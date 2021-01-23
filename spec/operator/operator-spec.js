// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { operator, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, setUp, errorHandler, throws, expectation, done) => {
    // test for completion catching any errors
    let completed = false, threw = false;
    // carry out a filter on the subject
    const operated = observable.pipe(operator(setUp, undefined, errorHandler), toArray());
    // place a subscription carry out the work
    operated.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // if an error is thrown and we expect an error record it
        if (throws) {
            // record so we can check later
            threw = e;
        } else {
            // quit on error
            done(e)
        }
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // single test to ensure we completed and unsubscribe in that order
        chai.expect((throws ? (threw == throws) : completed)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/operator functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, {}, false, false, "[1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, {}, false, false, "[1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, {}, false, false, "[1,2,3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, {}, false, false, "[null,1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the operator against an Observable with a failing setup", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, () => {
            throw("test")
        }, false, "test", undefined, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the operator against an Observable with a failing setup", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, () => {
            throw("test")
        }, (subscriber, e) => {
            // test the exception macthes
            chai.expect(e == "test").to.equal(true);
            // forward the error
            subscriber.error(e);
        }, "test", undefined, done);
    });
      
});

