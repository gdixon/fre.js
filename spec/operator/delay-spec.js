// import chai for testing
import chai from 'chai';
import sinon from 'sinon';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject, Queue } from "../../src";
// import toArray to finalise tests to one output
import { delay, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, expectation, done) => {
    // test for completion
    let completed = false, actionHappened1 = false, actionHappened2 = false, unsubscribed = false;
    // mock the timer
    const sandbox = sinon.createSandbox();
    const fakeTimer = sandbox.useFakeTimers();
    // carry out a filter on the subject
    const mapped = observable.pipe(delay(4), toArray());
    // place a subscription carry out the work
    mapped.subscribe((message) => {
        // mark that the action happened
        actionHappened1 = true;
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    });
    // carry out a filter on the subject
    const mappedWithScheduler = observable.pipe(delay(4, Queue, () => {
        unsubscribed = true;
    }), toArray());
    // place a subscription carry out the work
    mappedWithScheduler.subscribe((message) => {
        // mark that the action happened
        actionHappened2 = true;
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        chai.expect(actionHappened1 && actionHappened2 && completed && unsubscribed).to.be.true;
    });
    // carry out after set-up (if not Observable type)
    if (publisher) publisher(observable);
    // expect the delay to happen after appropriate time
    chai.expect(actionHappened1 || actionHappened2).to.be.false;
    fakeTimer.tick(2);
    chai.expect(actionHappened1 || actionHappened2).to.be.false;
    fakeTimer.tick(1);
    chai.expect(actionHappened1 || actionHappened2).to.be.false;
    fakeTimer.tick(1);
    // final action when this operator is unsubscribed
    sandbox.restore();
    // single test to ensure we completed
    chai.expect(completed).to.equal(true);
    // when all targets are complete then the operator should finish
    done();
};

describe("fre operator/delay functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the delay operator against an Observable", function (done) {
        defaultSpecCase( new Observable(helpers.withComplete), undefined, "[1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the delay operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, "[1,2,3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the delay operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, "[null,1,2,3,4]", done);
    });
      
});
