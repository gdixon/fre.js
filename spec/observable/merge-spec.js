// import chai for testing
import chai from 'chai';
// Merge with new Observables constructed for each test
import { Observable, Merge } from "../../src";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/Merge functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the merge method from Observable with synchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withComplete);
        const target2 = new Observable(helpers.withComplete);
        // carry out the concat on the targets and pipe to array
        const merged = Merge([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[1,2,3,4,1,2,3,4]";
        // place a subscription carry out the work
        merged.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            // fail on error
            done(e);
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the merge method from Observable with asynchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        // carry out the concat on the targets and pipe to array
        const merged = Merge([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[1,1,2,2,3,3,4,4]";
        // place a subscription carry out the work
        merged.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            // fail on error
            done(e);
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

});
