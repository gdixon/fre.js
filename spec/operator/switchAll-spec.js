// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject } from "../../src";
// import toArray to finalise tests to one output
import { groupBy, switchAll, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (source, predicate, publisher, expectation, done) => {
    // test for completion
    let completed = false;
    // group by age
    const example = source.pipe(
        // group the people by age
        groupBy(predicate),
        // return each item in group as array to collect the items in groups (on completion)
        switchAll(),
        // place into an array so we can check output with single expectation
        toArray()
    );
    // same expectation every time...
    example.subscribe((message) => {
        chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation));
    }, (e) => {
        // quit on error
        done(e)
    }, () => {
        // mark completion
        completed = true;
    }, () => {
        // test to ensure we completed and unsubscribe in that order
        chai.expect(completed).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // run the publisher against the source
    if (publisher) publisher(source);
};

// set-up spec testing feature-set
describe("fre operator/switchAll functionality", function () {

    // set-up spec testing feature-set against Observable
    it("should carry-out the switchAll operator with an Observable as source", function (done) {
        defaultSpecCase(new Observable(helpers.withPeople), person => person && person.age, undefined,    [
            { name: "Sue", age: 25 },
            { name: "Sarah", age: 35 },
            { name: "Joe", age: 30 }
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the switchAll operator with an Subject as source", function (done) {
        defaultSpecCase(new Subject(), person => person && person.age, helpers.withPeople,    [
            { name: "Sue", age: 25 },
            { name: "Sarah", age: 35 },
            { name: "Joe", age: 30 }
        ], done);
    });

    // set-up spec testing feature-set against BehaviourSubject
    it("should carry-out the switchAll operator with an BehaviourSubject as source", function (done) {
        defaultSpecCase(new BehaviourSubject(), person => person && person.age, helpers.withPeople,    [
            { name: "Sue", age: 25 },
            { name: "Sarah", age: 35 },
            { name: "Joe", age: 30 }
        ], done);
    });

});