// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { shareBehaviour, tap } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const trueRefCountSpecCase = (observable, publisher, args, finalCount, done) => {
    // count how many "next" messages are sent
    let called = 0, tapped = 0, dropped = 0;
    // carry out a filter on the subject
    const share = observable.pipe(tap(() => tapped++), shareBehaviour(...args));
    // subscribe and allow the message to propagate 
    const sub = share.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called - 1).to.equal(tapped);
    }, undefined, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount / 2).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable)
    if (publisher) publisher(observable);
    // complete - unsubs source        
    sub.complete();
    // subscribe and allow the message to propagate 
    share.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called - 2).to.equal(tapped);
    }, undefined, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable to fill Subject again)
    if (publisher) publisher(observable);
    // connect the stream and expect the result to return straight away
    share.subscribe(() => {
        // message from replaySubject so tapped is unaltered
        chai.expect(called - 2).to.equal(tapped);
    }, undefined, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount).to.equal(tapped);
    });
    // hasnt dropped until explicitly dropped
    chai.expect(dropped).to.equal(1);
    // unsub again but from the share which will also drop sub2
    share._subject.unsubscribe();
    // everything was called?
    chai.expect(called - 2).to.equal(finalCount);
    // all have been dropped
    chai.expect(dropped).to.equal(3);
    // finsihed with done]
    done();
};

const falseRefCountSpecCase = (observable, publisher, args, finalCount, done) => {
    // count how many "next" messages are sent
    let called = 0, tapped = 0, dropped = 0;
    // carry out a filter on the subject (refCount === false - share is never unsubscribed)
    const shared = observable.pipe(tap(() => tapped++), shareBehaviour(...args));
    // subscribe and allow the message to propagate 
    const sub = shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called - 1).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount / 2).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable)
    if (publisher) publisher(observable);
    // complete - unsubs source        
    sub.complete();
    // subscribe and allow the message to propagate 
    shared.subscribe((m) => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(finalCount / 2).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount / 2).to.equal(tapped);
    });
    // --- difference here -- no need to resupply the replaySubject because it never ended when refCount reached 0
    // connect the stream and expect the result to return straight away
    shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // message from replaySubject so tapped is unaltered
        chai.expect(finalCount / 2).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount / 2).to.equal(tapped);
    });
    // hasnt dropped until explicitly dropped
    chai.expect(dropped).to.equal(1);
    // unsub again but from the share which will also drop sub2
    shared._subject.unsubscribe();
    // everything was called? - we tapped the first set of messages once then we received one message (4) each subsequent subscribe
    chai.expect(called).to.equal((finalCount / 2) + 3);
    // all have been dropped
    chai.expect(dropped).to.equal(3);
    // finsihed with done]
    done();
}

describe("fre operator/shareBehaviour functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against an Observable with refCount == true", function (done) {
        trueRefCountSpecCase(new Observable(helpers.withoutComplete), undefined, [undefined, true, { test: true }], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against an Observable with refCount == false", function (done) {
        falseRefCountSpecCase(new Observable(helpers.withoutComplete), undefined, [undefined, false, { test: true }], 8, done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against a Subject with refCount == true", function (done) {
        trueRefCountSpecCase(new Subject(), helpers.withoutComplete, [undefined, true], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against a Subject with refCount == false", function (done) {
        falseRefCountSpecCase(new Subject(), helpers.withoutComplete, [undefined, false], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against a BehaviourSubject with refCount == true", function (done) {
        trueRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [undefined, { refCount: true }], 10, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareBehaviour operator against a BehaviourSubject with refCount == false", function (done) {
        falseRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [undefined, { refCount: false }], 10, done);
    });

});

