// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { startWith, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, forStarters, publisher, withUnsubscribe, expectation, done) => {
    // test for completion and unsubcription in that order
    let completed = false, unsubscribed = false;
    // place unsubscribe only when required
    if (withUnsubscribe) forStarters = forStarters.concat([() => (unsubscribed = true)]);
    // carry out a filter on the subject
    const startedWith = observable.pipe(startWith(...forStarters), toArray());
    // place a subscription carry out the work
    startedWith.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // single test to ensure we completed and unsubscribe in that order
        chai.expect(completed && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/startWith functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the startWith operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), [11, 22, 33, 44], undefined, false, "[11,22,33,44,1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the startWith operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), [11, 22, 33, 44], helpers.withComplete, true, "[11,22,33,44,1,2,3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the startWith operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), [11, 22, 33, 44], helpers.withComplete, true, "[11,22,33,44,null,1,2,3,4]", done);
    });
      
});
