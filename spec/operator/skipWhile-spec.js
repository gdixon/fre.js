// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { skipWhile, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, withUnsubscribe, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false;
    // carry out a filter on the subject
    const skipped = observable.pipe(skipWhile(project, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    skipped.subscribe((message) => {
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

describe("fre operator/skipWhile functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the skipWhile operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), (message) => message < 2, undefined, false, "[2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the skipWhile operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), (message) => message < 2, helpers.withComplete, true, "[2,3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the skipWhile operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), (message) => message < 2, helpers.withComplete, true, "[2,3,4]", done);
    });
      
});
