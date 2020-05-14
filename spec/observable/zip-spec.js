// import chai for testing
import chai from 'chai';
// Zip with new Observables constructed for each test
import { Observable, Zip } from "../../src";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/Zip functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the zip method from Observable with synchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withComplete);
        const target2 = new Observable(helpers.withComplete);
        // carry out the concat on the targets and pipe to array
        const latest = Zip([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[[1,1],[2,2],[3,3],[4,4]]";
        // place a subscription to carry out the work
        latest.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            // fail with error
            done(e);
        }, undefined, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the zip method from Observable with asynchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        // carry out the concat on the targets and pipe to array
        const latest = Zip([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[[1,1],[2,2],[3,3],[4,4]]";
        // place a subscription to carry out the work
        latest.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            // fail with error
            done(e);
        }, undefined, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    it("should use project function over each batch of messages", function (done) {
        // combineLatest from target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        // carry out a filter on the subject
        const zipped = Zip([target1, target2], (v1, v2) => v1 + v2 ).pipe(toArray());
        // expect to match
        const expectation = "[2,4,6,8]";
        // place a subscription to carry out the work
        zipped.subscribe((message) => {
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
        // place a project method on the CombineLatest that always throws
        const zipped = Zip([target1, target2], () => {
            throw("test");
        }).pipe(toArray());
        // place a subscription to carry out the work
        zipped.subscribe(() => {
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
        // carry out a filter on the subject
        const zipped = Zip([target1, target2], undefined, {
            // unsubscribe method (on CombineLatest - called when subscriber unsubscribes)
            unsubscribe: () => {
                unsubscribed = true;
            }
        }).pipe(toArray());
        // place a subscription to carry out the work
        const sub = zipped.subscribe(() => {
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
