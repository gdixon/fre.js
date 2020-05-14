// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { shareReplay, tap } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const trueRefCountSpecCase = (observable, publisher, args, finalCount, done) => {
    // count how many "next" messages are sent
    let called = 0, tapped = 0, dropped = 0;
    // carry out a filter on the subject
    const shared = observable.pipe(tap(() => tapped++), shareReplay(...args));
    // subscribe and allow the message to propagate 
    const sub = shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called).to.equal(tapped);       
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount/2).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable)
    if (publisher) publisher(observable);
    // complete - unsubs source        
    sub.complete();
    // subscribe and allow the message to propagate 
    shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable to fill Subject again)
    if (publisher) publisher(observable);
    // connect the stream and expect the result to return straight away
    shared.subscribe(() => {
        // message from replaySubject so tapped is unaltered
        chai.expect(called).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount).to.equal(tapped);
    });
    // hasnt dropped until explicitly dropped
    chai.expect(dropped).to.equal(1);
    // unsub again but from the share which will also drop sub2
    shared._subject.unsubscribe();
    // everything was called?
    chai.expect(called).to.equal(finalCount);
    // all have been dropped
    chai.expect(dropped).to.equal(3);
    // finsihed with done]
    done();
};

// carry out the same spec procedure with each Observable type
const falseRefCountSpecCase = (observable, publisher, args, finalCount, done) => {
    // count how many "next" messages are sent
    let called = 0, tapped = 0, dropped = 0;
    // carry out a filter on the subject (refCount === false - share is never unsubscribed)
    const shared = observable.pipe(tap(() => tapped++), shareReplay(...args));
    // subscribe and allow the message to propagate 
    const sub = shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(called).to.equal(tapped);       
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount/2).to.equal(tapped);
    });
    // carry out after set-up (if Observable like but not an Observable)
    if (publisher) publisher(observable);
    // complete - unsubs source        
    sub.complete();
    // subscribe and allow the message to propagate 
    shared.subscribe(() => {
        // incr before check to match tapped state
        called++;
        // prev wasnt called so called is still 0
        chai.expect(finalCount/2).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount/2).to.equal(tapped);
    });
    // - difference here 
    // -- no need to run publisher on source (for subject/behaviourSubject) because the replaySubject never ended when refCount reached 0
    // -- this is the way that Observables will behave by default - refCount=false means dont drop the subscription to source when refCount reaches 0
    // connect the stream and expect the result to return straight away
    shared.subscribe(() => {
        // message from replaySubject so tapped is unaltered
        chai.expect(finalCount/2).to.equal(tapped);
    }, (e) => {
        done(e);
    }, undefined, () => {
        // count how many are dropped
        dropped++;
        // called the last message
        chai.expect(finalCount/2).to.equal(tapped);
    });
    // hasnt dropped until explicitly dropped
    chai.expect(dropped).to.equal(1);
    // unsub again but from the share which will also drop sub2
    shared._subject.unsubscribe();
    // everything was called?
    chai.expect(called).to.equal(finalCount);
    // all have been dropped
    chai.expect(dropped).to.equal(3);
    // finsihed with done]
    done();
}

describe("fre operator/shareReplay functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against an Observable with refCount == true", function (done) {
        trueRefCountSpecCase(new Observable(helpers.withoutComplete), undefined, [8, {refCount: true}], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against an Observable with refCount == false", function (done) {
        falseRefCountSpecCase(new Observable(helpers.withoutComplete), undefined, [{refCount: false}], 8, done);
    });
    
    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a Subject with refCount == true", function (done) {
        trueRefCountSpecCase(new Subject(), helpers.withoutComplete, [{refCount: true}], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a Subject with refCount == false", function (done) {
        falseRefCountSpecCase(new Subject(), helpers.withoutComplete, [{refCount: false}], 8, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a BehaviourSubject with refCount == true", function (done) {
        trueRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [{refCount: true, test: true}], 10, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a BehaviourSubject with refCount == false", function (done) {
        falseRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [{refCount: false, test: true}], 10, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a BehaviourSubject with flat argument list with refCount == true", function (done) {
        trueRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [undefined, undefined, undefined, true, false, {}], 10, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the shareReplay operator against a BehaviourSubject with flat argument list with refCount == false", function (done) {
        falseRefCountSpecCase(new BehaviourSubject(), helpers.withoutComplete, [undefined, undefined, undefined, false, false, {}], 10, done);
    });

});
