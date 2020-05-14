// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { share, tap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, withSelector, args, expectation, expectedHits, expectedHits2, done) => {
    // expect these Taps and toArray method to be shared between all subscriptions (unless the source completes before a new subscription is made)
    let hits = 0, hits2 = 0, completed = 0;
    // carry out a chain of shared operators (this should connect all on first subscription to shared)
    const shared = observable.pipe(tap(() => hits++), tap(() => hits2++), (!withSelector ? toArray() : false), share(...args));
    // anything fed into the share which doesnt match known params will feed to options
    chai.expect(shared.options.test).to.equal(true);
    // place a subscription carry out the work
    shared.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
        chai.expect(hits).to.equal(expectedHits);
        chai.expect(hits2).to.equal(expectedHits);
    }, (e) => {
        done(e);
    }, () => {
        completed++;
    });
    // Observable source is self contained and completes -- this means each new subscription is a new connection
    // Subject(likes) will call the publisher once after subscribing to the subjects and will only call the shared subject once
    shared.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
        chai.expect(hits).to.equal(expectedHits2);
        chai.expect(hits2).to.equal(expectedHits2);
    }, (e) => {
        done(e);
    }, () => {
        completed++;
    }, () => {
        // completed should be called twice
        chai.expect(completed).to.equal(2);
        // complete on complet of this subscription
        done();
    });
    // carry out publisher once against the observable after connect (for Subjects and BehaviourSubjects)
    if (publisher) publisher(observable);
};

describe("fre operator/share functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the share operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, true, [toArray(), { "test": true }], "[1,2,3,4]", 4, 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the share operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, false, [{ "selector": false, "test": true }], "[1,2,3,4]", 4, 4, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the share operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, false, [false, { "test": true }], "[null,1,2,3,4]", 5, 5, done);
    });

});

