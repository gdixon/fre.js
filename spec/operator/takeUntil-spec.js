// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { takeUntil, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order - catching any errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const taken = observable.pipe(takeUntil(project, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    taken.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // collect the error message if we know this will throw
        if (willThrow) threw = e;
        // quit on error
        else done(e);
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

describe("fre operator/takeUntil functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the takeUntil operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableTimeoutSkips, undefined, false, false, "[1,2]", done);
    });


    // set-up spec testing feature-set
    it("should carry-out the takeUntil operator against an Observable throwing an error if the predicated Observable errors", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableError, undefined, true, true, "error", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the takeUntil operator against an Observable throwing an error when passing an !observable instance as project", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), false, undefined, true, true, "Notifier is not an Observable", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the takeUntil operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.observableTimeoutSkips, helpers.withTimeout, true, false, "[1,2]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the takeUntil operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.observableTimeoutSkips, helpers.withTimeout, true, false, "[null,1,2]", done);
    });
      
});