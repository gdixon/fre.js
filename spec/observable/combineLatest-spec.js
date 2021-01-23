// import chai for testing
import chai from 'chai';
// CombineLatest with new Observables constructed for each test
import { Observable, CombineLatest } from "../../src/fre.js";
// pipe the resultant stream to toArray to get a single testable output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/CombineLatest functionality", function() {

    // set-up spec testing feature-set
    it("should combine the latest messages synchronously when any emit (after all have emitted atleast once)", function (done) {
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withComplete);
        const target2 = new Observable(helpers.withComplete);
        const target3 = new Observable(helpers.withComplete);
        // carry out a filter on the subject
        const latest = CombineLatest([target1, target2, target3]).pipe(toArray());
        // expect to match
        const expectation = "[[4,4,1],[4,4,2],[4,4,3],[4,4,4]]";
        // place a subscription to carry out the work
        latest.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    it("should combine the latest messages asynchronously when any emit (after all have emitted atleast once)", function (done) {
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        const target3 = new Observable(helpers.withTimeout);
        // carry out a filter on the subject
        const latest = CombineLatest([target1, target2, target3]).pipe(toArray());
        // expect to match
        const expectation = "[[1,1,1],[2,1,1],[2,2,1],[2,2,2],[3,2,2],[3,3,2],[3,3,3],[4,3,3],[4,4,3],[4,4,4]]";
        // place a subscription to carry out the work
        latest.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    it("should use project function over each batch of messages", function (done) {
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        const target3 = new Observable(helpers.withTimeout);
        // carry out a filter on the subject
        const latest = CombineLatest([target1, target2, target3], (v1, v2, v3) => v1 + v2 + v3 ).pipe(toArray());
        // expect to match
        const expectation = "[3,4,5,6,7,8,9,10,11,12]";
        // place a subscription to carry out the work
        latest.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    it("should catch error in project function", function (done) {
        // check that the state matches expectation
        let noMessage = true;
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        const target3 = new Observable(helpers.withTimeout);
        // place a project method on the CombineLatest that always throws
        const latest = CombineLatest([target1, target2, target3], () => {
            throw("test");
        }).pipe(toArray());
        // place a subscription to carry out the work
        latest.subscribe(() => {
            noMessage = false;
        }, (e) => {
            // check the error matches expectation
            chai.expect(e).to.equal("test");
            // no message was received on the subscriber
            chai.expect(noMessage).to.equal(true);
            // when all targets are complete then the operator should finish
            done();
        });
    });

    it("should remove subscribers from all targets on cancel", function (done) {
        // check that the state matches expectation
        let noMessage = true, completed = false, unsubscribed = false;
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        const target3 = new Observable(helpers.withTimeout);
        // carry out a filter on the subject
        const latest = CombineLatest([target1, target2, target3], undefined, {
            // unsubscribe method (on CombineLatest - called when subscriber unsubscribes)
            unsubscribe: () => {
                unsubscribed = true;
            }
        }).pipe(toArray());
        // place a subscription to carry out the work
        const sub = latest.subscribe(() => {
            noMessage = false;
        }, (e) => {
            done(e);
        }, () => {
            completed = true;
        }, () => {
            // not unsubscribed yet...
            chai.expect(unsubscribed).to.equal(true); 
            // did not complete
            chai.expect(completed).to.equal(false);
            // did not complete
            chai.expect(noMessage).to.equal(true);
            // when all targets are complete then the operator should finish
            done();
        });
        // cancel the subscription
        sub.unsubscribe();
    });
});
