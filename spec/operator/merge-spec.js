// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { merge, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (target1, target2, publisher, expectation, done) => {
    // test for completion
    let completed = false;
    // carry out a filter on the subject
    const merged = target1.pipe(merge([target2]), toArray());
    // place a subscription carry out the work
    merged.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // single test to ensure we completed
        chai.expect(completed).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) {
        // subscribe both immediately so that we can merge the results based on timeout position
        publisher(target1);
        publisher(target2);
    }
};

describe("fre operator/merge functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the merge operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), new Observable(helpers.withTimeout), undefined, "[1,1,2,2,3,3,4,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the merge operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), new Subject(), helpers.withTimeout, "[1,1,2,2,3,3,4,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the merge operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), new BehaviourSubject(), helpers.withTimeout, "[null,null,1,1,2,2,3,3,4,4]", done);
    });
      
});
