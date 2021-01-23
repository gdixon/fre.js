// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { pairwise, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, withUnsubscribe, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false;
    // carry out a filter on the subject
    const pairWised = observable.pipe(pairwise((withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    pairWised.subscribe((message) => {
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

describe("fre operator/pairwise functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the pairwise operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, true, "[[1,2],[2,3],[3,4]]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the pairwise operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, true, "[[1,2],[2,3],[3,4]]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the pairwise operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, false, "[[null,1],[1,2],[2,3],[3,4]]", done);
    });
      
});
