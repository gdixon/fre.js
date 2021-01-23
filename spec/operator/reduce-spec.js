// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { reduce, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order - catching any errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out the operator on the subject
    const reduced = observable.pipe(reduce(project, undefined, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    reduced.subscribe((message) => {
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
        // test to ensure we completed and unsubscribe in that order catching any errors
        chai.expect((!willThrow ? completed : (!completed && threw == expectation)) && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/reduce functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the reduce operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), (value, message) => (value || 0) + message, undefined, false, false, "[10]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the reduce operator against an Observable with a failing project", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), () => {
            throw("test")
        }, undefined, true, true, "test", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the reduce operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), (value, message) => (value || 0) + message, helpers.withComplete, true, false, "[10]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the reduce operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(1), (value, message) => (value || 0) + message, helpers.withComplete, true, false, "[11]", done);
    });
      
});