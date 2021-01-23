// import chai for testing
import chai from 'chai';
// Concat with new Observables constructed for each test
import { Observable, Concat } from "../../src/fre.js";
// pipe the resultant stream to toArray to get a single testable output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/Concat functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the Concat method from Observable with synchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withComplete);
        const target2 = new Observable(helpers.withComplete);
        // carry out the concat on the targets and pipe to array
        const concatenated = Concat([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[1,2,3,4,1,2,3,4]";
        // place a subscription to carry out the work
        concatenated.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the Concat method from Observable with asynchronous targets", function (done) {
        // concat target1 and target1
        const target1 = new Observable(helpers.withTimeout);
        const target2 = new Observable(helpers.withTimeout);
        // carry out the concat on the targets and pipe to array
        const concatenated = Concat([target1, target2]).pipe(toArray());
        // expect to match
        const expectation = "[1,2,3,4,1,2,3,4]";
        // place a subscription to carry out the work
        concatenated.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            // when all targets are complete then the operator should finish
            done();
        });
    });
});
