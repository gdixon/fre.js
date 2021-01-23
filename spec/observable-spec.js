// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subscriber } from "../src/fre.js";
// import toArray to finalise tests to one output
import { toArray } from "../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "./helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, state, willThrow, expectation, done) => {
    // test for completion with jasmine
    let completed = false, threw = false;
    // create a subscriber to subscribe to the observable
    const subscriber = new Subscriber((message) => {
        chai.expect(JSON.stringify(message)).to.equal(expectation);
    }, (e) => {
        if (willThrow) {
            threw = e;
        } else {
            // quit on error
            done(e);
        }
    }, () => {
        // mark completion
        completed = true;
    });
    // place a subscription carry out the work
    observable.subscribe(subscriber);
    // subscribing same subscriber again has no effect
    observable.subscribe(subscriber);
    // single expectation to ensure we completed and unsubscribe in that order
    chai.expect((!willThrow ? completed : (!completed && threw == expectation)) && (typeof state.unsubscribed === "undefined" || state.unsubscribed == true)).to.equal(true);
    // when all targets are complete then the operator should finish
    done();
};

describe("fre Observable functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the reduce operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete).reduce((value, message) => value + message, 0).pipe(toArray()), {}, false, "[10]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the reduce operator against an Observable with a failing project", function (done) {
        // watch for unsubscribed state change
        let state = { unsubscribed: false };
        // check reduce method on Observable pipes properly
        defaultSpecCase(new Observable(helpers.withComplete).reduce(() => {throw ("test");}, undefined, () => (state.unsubscribed = true)), state, true, "test", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the map operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete).map((message) => message + 1).pipe(false, toArray()), {}, false, "[2,3,4,5]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the map operator against an Observable with a failing project", function (done) {
        // watch for unsubscribed state change
        let state = { unsubscribed: false };
        // check reduce method on Observable pipes properly
        defaultSpecCase(new Observable(helpers.withComplete).map(() => {throw ("test");}, () => (state.unsubscribed = true)), state, true, "test", done);
    });


    // set-up spec testing feature-set
    it("should carry-out the filter operator against an Observable", function (done) {
        defaultSpecCase(new Observable(helpers.withComplete).filter((message) => message > 2).pipe(toArray()), {}, false, "[3,4]", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the filter operator against an Observable with a failing project", function (done) {
        // watch for unsubscribed state change
        let state = { unsubscribed: false };
        // check reduce method on Observable pipes properly
        defaultSpecCase(new Observable(helpers.withComplete).filter(() => {throw ("test");}, () => (state.unsubscribed = true)), state, true, "test", done);
    });

    // set-up spec testing feature-set
    it("should carry-out the pipe operator against an Observable and throw if any piped method does not resolve to Observable", function (done) {
        try {
            new Observable(helpers.withComplete).pipe(() => { });
        } catch (e) {
            chai.expect(e == "cannot pipe to !Observable constructs").to.equal(true);
            done();
        }
    });

    // set-up spec testing feature-set
    it("should carry-out allow for Observable to pass next, error, complete and unsubscribe methods rather than subscriber", function (done) {
        // test for completion with jasmine
        let completed = false, unsubscribed = false;
        // test that an observable can be subscribed to with methods rather than subscriber
        const observable = new Observable((subscriber) => {
            // run the asynchronous publisher
            helpers.withTimeout(subscriber);

            // return a teardown operation to be performed before unsubscribing
            return () => {
                unsubscribed = true;
            }
        }).pipe(toArray());
        // place a subscription carry out the work
        observable.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            // quit on error
            done(e);
        }, () => {
            // mark completion
            completed = true;
        }, function(){
             // both have been called (but unsubscribed was set after)
            chai.expect(completed && unsubscribed).to.equal(true);
            // when all targets are complete then the operator should finish
            done();
        });
    });

    // set-up spec testing feature-set
    it("should catch any errors thrown by the publisher and emit errors to the subscriber", function (done) {
        // test that an observable can be subscribed to with methods rather than subscriber
        const observable = new Observable(() => {
            throw("error");
        }).pipe(toArray());
        // place a subscription carry out the work
        observable.subscribe(() => {
            done("no message")
        }, (e) => {
            // expect an error to be raised
            chai.expect(e).to.equal("error");
        }, () => {
            // mark completion
            done("should not complete")
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });
    
    // set-up spec testing feature-set
    it("should be able to access Observable by symbol", function (done) {
        try {
            // test that an observable can be subscribed to with methods rather than subscriber
            const observable = new Observable(helpers.withComplete);
            // retrieve observable from observable instance
            const symbolObservable = observable[typeof Symbol === "function" && Symbol.observable || "@@observable"]();
            // both have been called (but unsubscribed was set after)
            chai.expect(observable == symbolObservable).to.equal(true);
            // when all targets are complete then the operator should finish
            done();
        } catch (e) {
            done(e);
        }
    
    });

});
