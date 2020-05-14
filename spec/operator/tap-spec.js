// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { tap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, withProject, withUnsubscribe, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false, value = 0;
    // carry out a filter on the subject
    const tapped = observable.pipe(tap((withProject ? (message) => {
        value = value + (message || 0);
    } : undefined), (withUnsubscribe ? () => {
        unsubscribed = true;
    } : undefined)), toArray());
    // place a subscription carry out the work
    tapped.subscribe(() => {
        chai.expect(value).to.equal(expectation);
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // test to ensure we completed and unsubscribe in that order
        chai.expect(completed && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/tap functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the tap operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, true, false, 10, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the tap operator against an Observable without a next message", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, false, true, 0, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the tap operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, true, true, 10, done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the tap operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(1), helpers.withComplete, true, true, 11, done);
    });
      
});
