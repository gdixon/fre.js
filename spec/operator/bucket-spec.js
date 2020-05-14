// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject, From, ReplaySubject } from "../../src";
// import toArray to finalise tests to one output
import { bucket, mergeMap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// future works -- It would be useful to have a boundaryOrder - to stipulate when the boundary should emit/complete

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (source, publisher, asArray, withUnsubscribe, defaultGroup, concurrency, elementSelector, durationSelector, subjectSelector, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false;
    // group by age
    const example = source.pipe(
        // group the people by age
        bucket([0, 25, 30], defaultGroup, (person) => person && person.age, elementSelector, durationSelector, subjectSelector, (withUnsubscribe ? () => (unsubscribed = true) : false)),
        // return each item in group as array to collect the items so that theyre re-emitted together
        mergeMap(group => group.pipe(toArray()), undefined, concurrency),
        // check if the response should be mapped to a single array (grouped into boundaries)
        (asArray ? mergeMap((message) => From(message)) : false), 
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
        // single test to ensure we completed and unsubscribe in that order
        chai.expect(completed && (withUnsubscribe ? unsubscribed : true)).to.equal(true);
        // when all targets are complete then the operator should finish
        done();
    });
    // run the publisher against the source
    if (publisher) publisher(source);
};

// set-up spec testing feature-set
describe("fre operator/bucket functionality", function () {

    // set-up spec testing feature-set against Observable
    it("should carry-out the bucket operator with an Observable as source", function (done) {
        // synchronously emits all people into boundaries and subscribes to the boundaries using mergeMap to return a single response
        defaultSpecCase(new Observable(helpers.withPeople), undefined, false, true, "default", undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Joe", age: 30 }],
            [{ name: "Sarah", age: 35 }]
        ], done);
    });

    // set-up spec showing implementation - inorder to get back to an array/stream
    it("should carry-out the bucket operator with an Observable as source and pipe to a single ordered array", function (done) {
        // same as above but returns a single array because "asArray" is set to true (runs an additional map back to array over each boundary group)
        // also skips out on setting additional "unsubscribe" method to cover the case when one isnt set
        defaultSpecCase(new Observable(helpers.withPeople), undefined, true, false, "default", undefined, undefined, undefined, undefined, [
            { name: "Sue", age: 25 }, { name: "Frank", age: 25 },
            { name: "Joe", age: 30 },
            { name: "Sarah", age: 35 }
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the bucket operator with an Subject as source", function (done) {
        // same as the first case but against a Subject
        defaultSpecCase(new Subject(), helpers.withPeople, false, true, "default", undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Joe", age: 30 }],
            [{ name: "Sarah", age: 35 }]
        ], done);
    });

    // set-up spec testing feature-set against BehaviourSubject
    it("should carry-out the bucket operator with an BehaviourSubject as source", function (done) {
        // same as first case but against an Observable
        defaultSpecCase(new BehaviourSubject(), helpers.withPeople, false, true, "default", undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Joe", age: 30 }],
            [undefined, { name: "Sarah", age: 35 }]
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the bucket operator with an async Subject as source", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response
        // (* note that because the Subject has no backpressure any late subscribers (caused by the concat) will miss the messages being emitted by the bucket operator)
        defaultSpecCase(new Subject(), helpers.withPeopleOverTime, false, true, "default", 1, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [],
            []
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the bucket operator with an async Subject as source and a durationSelector", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response
        // however we also issue a durationSelector which unsubscribes the chain on first message - the first message of the durationSelector comes before
        // any message out of the bucket - so everything is received empty
        defaultSpecCase(new Subject(), helpers.withPeopleOverTime, false, true, "default", 1, undefined, () => helpers.observableTimeout, undefined, [
            [],
            [],
            []
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the bucket operator with an async Subject as source and a SubjectSelector Factory which replays all emitted", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response of mapped entries (using elementSelector)
        defaultSpecCase(new Subject(), helpers.withPeopleOverTime, false, true, "default", 1, (message, boundary) => Object.assign(message, { boundary: boundary }), undefined, () => new ReplaySubject(), [
            [{ name: "Sue", age: 25, boundary: { lower: 0, upper: 25 } }, { name: "Frank", age: 25, boundary: { lower: 0, upper: 25 } }],
            [{ name: "Sarah", age: 35, boundary: { default: "default"} }],
            [{ name: "Joe", age: 30, boundary: { lower: 25, upper: 30 } }]
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the bucket operator with an async Subject as source, no default and a single SubjectSelector which replays all emitted", function (done) {
        // this covers an unlikely case - a single subject shared between groups which also skips out on the default boundary altogether
        defaultSpecCase(new Subject(), helpers.withPeopleOverTime, false, true, undefined, 1, undefined, undefined, new ReplaySubject(), [
            [{ name: "Sue", age: 25 }, { name: "Joe", age: 30 }, { name: "Frank", age: 25 }],
            [{ name: "Sue", age: 25 }, { name: "Joe", age: 30 }, { name: "Frank", age: 25 }],
        ], done);
    });

});