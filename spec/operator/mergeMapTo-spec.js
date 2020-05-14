// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { mergeMapTo, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase =  (observable, project, concurrency, publisher, expectation, done) => {
    // test for completion
    let completed = false;
    // carry out a filter on the subject
    const merged = observable.pipe(mergeMapTo(project.map((m) => "mapped" + m), (a, b) => { return b}, concurrency), toArray());
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
    if (publisher) publisher(observable);
};

describe("fre operator/mergeMapTo functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the mergeMapTo operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableTimeout, 2, undefined, "[\"mapped1\",\"mapped2\",\"mapped1\",\"mapped3\",\"mapped2\",\"mapped4\",\"mapped3\",\"mapped1\",\"mapped4\",\"mapped2\",\"mapped1\",\"mapped3\",\"mapped2\",\"mapped4\",\"mapped3\",\"mapped4\"]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the mergeMapTo operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.observableTimeout, 2, helpers.withTimeout, "[\"mapped1\",\"mapped2\",\"mapped1\",\"mapped3\",\"mapped2\",\"mapped4\",\"mapped3\",\"mapped1\",\"mapped4\",\"mapped2\",\"mapped1\",\"mapped3\",\"mapped2\",\"mapped4\",\"mapped3\",\"mapped4\"]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the mergeMapTo operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.observableTimeout, 2, helpers.withTimeout, "[\"mapped1\",\"mapped1\",\"mapped2\",\"mapped2\",\"mapped3\",\"mapped3\",\"mapped4\",\"mapped4\",\"mapped1\",\"mapped1\",\"mapped2\",\"mapped2\",\"mapped3\",\"mapped3\",\"mapped4\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\"]", done)
    });
      
});