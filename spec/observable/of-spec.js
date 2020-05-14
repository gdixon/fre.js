// import chai for testing
import chai from 'chai';
// FromArray to create a new Observable for each test
import { Of } from "../../src";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";

// set-up spec testing feature-set
describe("fre Observable/Of functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the of method from Observable", function (done) {
        // carry out a filter on the subject
        const backToArray = Of(1,2,3,4).pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

});
