// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { concat, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (target1, target2, publisher, expectation, done) => {
    // test for completion with jasmine
    let completed = false;
    // carry out a filter on the subject
    const concatenated = target1.pipe(concat([target2]), toArray());
    // place a subscription to carry out the work
    concatenated.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
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
    // assign as publisher so that we're not chasing the .complete call
    if (publisher) {
        // delay the second until complete of first to simulate publisher behaviour for Observable concats 
        // (if we start both at the same time then the second instance will finish before the concat moves on to it - does this have to be the case - how can we delay it internaly?)
        const complete = target1.complete;
        // we want the second starting after the first finishes (this is because normally we would just use Publisher but this simiulates behaviour)
        target1.complete = function () {
            complete.call(this);
            publisher(target2);
        };
        // place as post set-up publishers
        publisher(target1);
    }
};

describe("fre operator/concat functionality", function () {

    // set-up spec testing feature-set against Observable
    it("should carry-out the concat operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withTimeout), new Observable(helpers.withTimeout), undefined, "[1,2,3,4,1,2,3,4]", done)
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the concat operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), new Subject(), helpers.withTimeout, "[1,2,3,4,1,2,3,4]", done)
    });

    // set-up spec testing feature-set against BehaviourSubject
    it("should carry-out the concat operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), new BehaviourSubject(), helpers.withTimeout, "[null,1,2,3,4,null,1,2,3,4]", done)
    });

});
