// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { mergeMap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// map the helper for expectations (joins outer message to inner message)
const mappedTimeout = (message) => helpers.observableTimeout.map((m) => message + "-mapped" + m);

// carry out the same spec procedure with each Observable type
const defaultSpecCase =  (observable, project, selector, concurrency, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubscription in that order - cantching any thrown errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const merged = observable.pipe(mergeMap(project, selector, concurrency, (withUnsubscribe ? () => (unsubscribed = true) : false)), toArray());
    // place a subscription carry out the work
    merged.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // record error if the test will throw so we can check it against expectation
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
        // single test to ensure we completed and unsubscribe in that order
        chai.expect((willThrow ? (threw == expectation) : completed) && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
};

describe("fre operator/mergeMap functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), (message) => mappedTimeout(message), (a, b) => { return b}, 2, undefined, false, false, "[\"1-mapped1\",\"1-mapped2\",\"2-mapped1\",\"1-mapped3\",\"2-mapped2\",\"1-mapped4\",\"2-mapped3\",\"3-mapped1\",\"2-mapped4\",\"3-mapped2\",\"4-mapped1\",\"3-mapped3\",\"4-mapped2\",\"3-mapped4\",\"4-mapped3\",\"4-mapped4\"]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against an Observable and throw error when provided non Observable project", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), [], (a, b) => { return b}, 2, undefined, true, true, "MergeMap: Project must be supplied as fn which resolves to an Observable", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against an Observable and throw error when projected Observable errors", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableError, (a, b) => { return b}, 2, undefined, true, true, "error", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against an Observable and throw error when projected Observable errors", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), (message) => mappedTimeout(message), () => { throw("error"); }, 2, undefined, true, true, "error", done);
    });
        
    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), (message) => mappedTimeout(message), (a, b) => { return b}, 2, helpers.withTimeout, true, false, "[\"1-mapped1\",\"1-mapped2\",\"2-mapped1\",\"1-mapped3\",\"2-mapped2\",\"1-mapped4\",\"2-mapped3\",\"3-mapped1\",\"2-mapped4\",\"3-mapped2\",\"4-mapped1\",\"3-mapped3\",\"4-mapped2\",\"3-mapped4\",\"4-mapped3\",\"4-mapped4\"]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the mergeMap operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), (message) => mappedTimeout(message), (a, b) => { return b}, 2, helpers.withTimeout, true, false, "[\"undefined-mapped1\",\"1-mapped1\",\"undefined-mapped2\",\"1-mapped2\",\"undefined-mapped3\",\"1-mapped3\",\"undefined-mapped4\",\"1-mapped4\",\"2-mapped1\",\"3-mapped1\",\"2-mapped2\",\"3-mapped2\",\"2-mapped3\",\"3-mapped3\",\"2-mapped4\",\"3-mapped4\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done)
    });
      
});
