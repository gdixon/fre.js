// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { switchMap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";


// carry out the same spec procedure with each Observable type
const defaultSpecCase =  (observable, project, selector, publisher, withUnsubscribe, willThrow, expectation, done) => {
    // test for completion and unsubcription in that order - catching any errors
    let completed = false, unsubscribed = false, threw = false;
    // carry out a filter on the subject
    const switched = observable.pipe(switchMap(project, selector, (withUnsubscribe ? () => {(unsubscribed = true);} : false)), toArray());
    // place a subscription carry out the work
    switched.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // 
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

describe("fre operator/switchMap functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), (o) => helpers.observableTimeout.map((m) => o + "-mapped" + m), (a, b) => { return b}, undefined, false, false, "[\"1-mapped1\",\"1-mapped2\",\"2-mapped1\",\"2-mapped2\",\"3-mapped1\",\"3-mapped2\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against an Observable and throw error when provided non Observable project", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), [], (a, b) => { return b}, undefined, true, true, "SwitchMap: Project must be supplied as fn which resolves to an Observable", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against an Observable and throw error when projected Observable errors", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), helpers.observableError, undefined, undefined, true, true, "error", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against an Observable and throw error when selector errors", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), (o) => helpers.observableTimeout.map((m) => o + "-mapped" + m), () => { throw("error"); }, undefined, true, true, "error", done);
    });
        
    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), (o) => helpers.observableTimeout.map((m) => o + "-mapped" + m), (a, b) => { return b}, helpers.withTimeout, true, false, "[\"1-mapped1\",\"1-mapped2\",\"2-mapped1\",\"2-mapped2\",\"3-mapped1\",\"3-mapped2\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the switchMap operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), (o) => helpers.observableTimeout.map((m) => o + "-mapped" + m), (a, b) => { return b}, helpers.withTimeout, true, false, "[\"undefined-mapped1\",\"1-mapped1\",\"1-mapped2\",\"2-mapped1\",\"2-mapped2\",\"3-mapped1\",\"3-mapped2\",\"4-mapped1\",\"4-mapped2\",\"4-mapped3\",\"4-mapped4\"]", done);
    });
      
});
