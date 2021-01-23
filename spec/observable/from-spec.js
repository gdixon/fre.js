// import chai for testing
import chai from 'chai';
// From to create a new Observable for each test
import { From } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/From functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the from method from Observable using Object", function (done) {
        // carry out a filter on the subject
        const backToArray = From([1, 2, 3, 4]).pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the From method from Observable using String", function (done) {
        // carry out a filter on the subject
        const backToArray = From("test").pipe(toArray());
        // place a subscription carry out the work
        backToArray.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[\"t\",\"e\",\"s\",\"t\"]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    it("should carry-out the From method from Observable using a generator as input", function (done) {
        // fromObservable also accepts a generator-like method and exhausts it
        function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {
                yield i;
            }
        };
        // carry out a filter on the subject
        const resultOfCallback = From(generatorFunction(1, 4)).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    it("should carry-out the From method from Observable using a generator as input", function (done) {
        // fromObservable also accepts a generator-like method and exhausts it
        async function* generatorFunction(start, end) {
            for (let i = start; i <= end; i++) {
                // await the result of timing out for 10ms
                await new Promise(resolve => setTimeout(resolve, 10));

                yield i;
            }
        }
        // carry out a filter on the subject
        const resultOfCallback = From(generatorFunction(1, 4)).pipe(toArray());
        // place a subscription carry out the work
        resultOfCallback.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            done(e)
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the from method from Observable using Promise", function (done) {
        // carry out a filter on the subject
        const resultOfPromise = From(new Promise((resolve) => resolve([1, 2, 3, 4])));
        // place a subscription carry out the work
        resultOfPromise.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, undefined, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the from method from Observable using Observable", function (done) {
        // carry out a filter on the subject
        const resultantObservable = From(helpers.observableTimeout).pipe(toArray());
        // place a subscription carry out the work
        resultantObservable.subscribe((message) => {
            chai.expect(JSON.stringify(message)).to.equal("[1,2,3,4]");
        }, (e) => {
            done(e);
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should throw if provided no iterable source", function (done) {
        // feed with values to get Observable
        const observable = From(1);
        // place a subscription carry out the work
        observable.subscribe(undefined, (e) => {
            // carries the error through
            chai.expect(e).to.equal("number is not observable");
        }, undefined, function () {
            // finsihed with done]
            done();
        });
    });

});
