// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { skipUntil, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const skipped = observable.pipe(skipUntil(project, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    skipped.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        if (willThrow) {
            threw = e;
        } else {
            // quit on error
            done(e);
        }
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // single test to ensure we completed and unsubscribe in that order catching any errors
        chai.expect((!willThrow ? completed : (!completed && threw == expectation)) && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/skipUntil functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the skipUntil operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableTimeoutSkips, undefined, false, false, "[3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the skipUntil operator against an Observable and fail if not provided a Notifier", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), false, undefined, true, true, "Notifier is not an Observable", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the skipUntil operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.observableTimeoutSkips, helpers.withTimeout, true, false, "[3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the skipUntil operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.observableTimeoutSkips, helpers.withTimeout, true, false, "[3,4]", done);
    });
      
});
