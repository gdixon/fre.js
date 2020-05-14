// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { concatMap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, expectation, done) => {
    // test for completion
    let completed = false;
    // carry out a map on the subject
    const reduced = observable.pipe(concatMap((message) => project.map((m) => message + "-mapped" + m)), toArray());
    // place a subscription carry out the work
    reduced.subscribe((message) => {
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

describe("fre operator/concatMap functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the concatMap operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableTimeout, undefined, "[\"1-mapped1\",\"1-mapped2\",\"1-mapped3\",\"1-mapped4\",\"2-mapped1\",\"2-mapped2\",\"2-mapped3\",\"2-mapped4\",\"3-mapped1\",\"3-mapped2\",\"3-mapped3\",\"3-mapped4\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the concatMap operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.observableTimeout, helpers.withTimeout, "[\"1-mapped1\",\"1-mapped2\",\"1-mapped3\",\"1-mapped4\",\"2-mapped1\",\"2-mapped2\",\"2-mapped3\",\"2-mapped4\",\"3-mapped1\",\"3-mapped2\",\"3-mapped3\",\"3-mapped4\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the concatMap operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.observableTimeout, helpers.withTimeout, "[\"undefined-mapped1\",\"undefined-mapped2\",\"undefined-mapped3\",\"undefined-mapped4\",\"1-mapped1\",\"1-mapped2\",\"1-mapped3\",\"1-mapped4\",\"2-mapped1\",\"2-mapped2\",\"2-mapped3\",\"2-mapped4\",\"3-mapped1\",\"3-mapped2\",\"3-mapped3\",\"3-mapped4\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });
    
});
