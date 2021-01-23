// import chai for testing
import chai from 'chai';
// ForkJoin on new Observables constructed for each test
import { Observable, ForkJoin } from "../../src/fre.js";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/ForkJoin functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the forkJoin method from Observable with synchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withComplete);
        const target2 = new Observable(helpers.withComplete);
        // carry out the forkJoin on the targets (merges then pipes toArray)
        const merged = ForkJoin(target1, target2);
        // expect to match
        const expectation = "[1,2,3,4,1,2,3,4]";
        // place a subscription carry out the work
        merged.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the forkJoin method from Observable with asynchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        // carry out the forkJoin on the targets (merges then pipes toArray)
        const merged = ForkJoin(target1, target2);
        // expect to match
        const expectation = "[1,1,2,2,3,3,4,4]";
        // place a subscription carry out the work
        merged.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });
});
