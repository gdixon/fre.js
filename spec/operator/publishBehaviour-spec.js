// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { publishBehaviour, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, expectation, done) => {
    // count how many "next" messages are sent
    let called = 0;
    // carry out a filter on the subject
    const publish = observable.pipe(toArray(), publishBehaviour(undefined, {refCount: false}));
    // place a subscription - this will immediately emit with initialValue (undefined) - however it will be cancelled before any true messages land
    let subscription = publish.subscribe(() => called = true);
    // prev wasnt called so called is still 0
    chai.expect(called).to.equal(true);
    // remove the subscription
    subscription.unsubscribe();
    // subscribe and allow the message to propagate 
    publish.subscribe((message) => {
        // initiate the called counter then start incrementing
        called = (called === true ? 1 : called+1);
        // when the actual message lands...
        if (message) {
            // check the message matches expectation
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }
    }, (e) => {
        // throw any failure
        done(e)
    }, () => {
        // check that this was called twice (because the publishBehaviour repeated it)
        chai.expect(called).to.equal(2);
        done();
    });
    // connect the stream (this should be tested against an observer that completes synchronously)
    publish.connect();
    // carry out after set-up (if Observable like but not an Observable)
    if (publisher) publisher(observable);
};

describe("fre operator/publishBehaviour functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the publishBehaviour operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete), undefined, "[1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the publishBehaviour operator against a Subject", function (done) {
        defaultSpecCase(new Subject(), helpers.withComplete, "[1,2,3,4]", done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the publishBehaviour operator against a BehaviourSubject", function (done) {
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, "[null,1,2,3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the publishBehaviour operator against a BehaviourSubject passing refCount and a selector", function (done) {
        // count how many "next" messages are sent
        let called = 0;
        const observable = new BehaviourSubject();
        const publisher = helpers.withComplete;
        const expectation = "[null,null,1,2,3,4]";
        // carry out a filter on the subject
        const published = observable.pipe(publishBehaviour(undefined, true, toArray(), { test: true }));
        // subscribe and allow the message to propagate 
        published.subscribe((message) => {
            called++;
            // when the actual message lands...
            if (message) {
                // check the message matches expectation
                chai.expect(JSON.stringify(message)).to.equal(expectation);
            }
        }, (e) => {
            done(e)
        });
        // carry out after set-up (if Observable like but not an Observable)
        if (publisher) publisher(observable); 
        // connect the stream and expect the result to return straight away
        const subscription2 = published.subscribe((message) => {
            // done("never called because the multicast completed before this subscription")
            // check the message matches expectation
            chai.expect(JSON.stringify(message)).to.equal("[4]");
            // incr so we check the next message happened in order of execution
            called++;
        }, (e) => {
            done(e)
        }, undefined, function () {
            // called the last message
            chai.expect(called).to.equal(2);
            // finsihed with done]
            done();
        });
        // drop the subscription to close (note that completing does not close a subject?)
        subscription2.unsubscribe();
        // reopen the subscription after running through publisher fns
        if (publisher) publisher(observable);
    });

    // set-up spec testing feature-set
    it("should carry-out the publishBehaviour operator against a BehaviourSubject passing refCount and a selector using options", function (done) {
        // count how many "next" messages are sent
        let called = 0;
        const observable = new BehaviourSubject();
        const publisher = helpers.withComplete;
        const expectation = "[null,null,1,2,3,4]";
        // carry out a filter on the subject
        const published = observable.pipe(publishBehaviour(undefined, true, { selector: toArray(), test: true }));
        // subscribe and allow the message to propagate 
        published.subscribe((message) => {
            // incr so we check the next message happened in order of execution
            called++;
            // when the actual message lands...
            if (message) {
                // check the message matches expectation
                chai.expect(JSON.stringify(message)).to.equal(expectation);
            }
        }, (e) => {
            done(e)
        });
        // carry out after set-up (if Observable like but not an Observable)
        if (publisher) publisher(observable); 
        // connect the stream and expect the last message of publisher to be replayed to the new subscriber
        const subscription2 = published.subscribe((message) => {
            // done("never called because the multicast completed before this subscription")
            // check the message matches expectation
            chai.expect(JSON.stringify(message)).to.equal("[4]");
            // incr so we check the next message happened in order of execution
            called++;
        }, (e) => {
            done(e)
        }, undefined, function () {
            // called the last message
            chai.expect(called).to.equal(2);
            // finsihed with done]
            done();
        });
        // drop the subscription to close (note that completing does not close a subject?)
        subscription2.unsubscribe();
        // reopen the subscription after running through publisher fns
        if (publisher) publisher(observable);
    });
      
});
