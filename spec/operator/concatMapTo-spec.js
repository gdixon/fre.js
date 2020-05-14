// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { concatMapTo, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, project, publisher, expectation, done) => {
    // test for completion
    let completed = false;
    // carry out a map on the subject
    const reduced = observable.pipe(concatMapTo(project.map((m) => "mapped" + m), (a, b) => { return b}), toArray());
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

describe("fre operator/concatMapTo functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the concatMapTo operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableTimeout, undefined, "[\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\"]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the concatMapTo operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.observableTimeout, helpers.withTimeout, "[\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\"]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the concatMapTo operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.observableTimeout, helpers.withTimeout, "[\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\",\"mapped1\",\"mapped2\",\"mapped3\",\"mapped4\"]", done);
    });
      
});
