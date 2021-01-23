// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { take, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, takes, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order - catching any errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const taken = observable.pipe(take(takes, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    taken.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // if an error is thrown and we expect an error record it
        if (willThrow) {
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
        // test to ensure we completed and unsubscribe in that order catching any errors
        chai.expect((!willThrow ? completed : (!completed && threw == expectation)) && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/take functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the take operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), 2, undefined, false, false, "[1,2]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the take operator against an Observable and throw if not provided as int or is falsy", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), 0, undefined, true, true, "Take must be int", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the take operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), 2, helpers.withComplete, true, false, "[1,2]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the take operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), 2, helpers.withComplete, true, false, "[null,1]", done);
    });
      
});
