// import chai for testing
import chai from 'chai';
// FromCallback to create a new Observable for each test
import { FromCallback } from "../../src/fre.js";

// set-up spec testing feature-set
describe("fre Observable/FromCallback functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the fromCallback method from Observable", function (done) {
        // carry out a filter on the subject
        const resultOfCallback = FromCallback((a, callback) => callback([1,2,3,4].map((v) => a + v)));
        // feed with values to get Observable
        const observable = resultOfCallback("a");
        // place a subscription carry out the work
        observable.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[\"a1\",\"a2\",\"a3\",\"a4\"]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the fromCallback method from Observable and fail", function (done) {
        // carry out a filter on the subject
        const resultOfCallback = FromCallback(() => {
            // dummy a fail case
            throw("exception")
        });
        // feed with values to get Observable
        const observable = resultOfCallback();
        // place a subscription carry out the work
        observable.subscribe(undefined, (e) => {
            // carries the error through
            chai.expect(e).to.equal("exception");
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

});
