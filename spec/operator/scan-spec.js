// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { scan, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order - catching any errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const scanned = observable.pipe(scan(project, 0, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    scanned.subscribe((message) => {
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

describe("fre operator/scan functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the scan operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), (value, message) => value + message, undefined, false, false, "[1,3,6,10]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the scan operator against an Observable with a failing project", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), () => {
            throw("test")
        }, undefined, true, true, "test", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the scan operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), (value, message) => value + message, helpers.withComplete, true, false, "[1,3,6,10]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the scan operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(1), (value, message) => value + message, helpers.withComplete, true, false, "[1,2,4,7,11]", done);
    });
      
});

