// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject, ReplaySubject, From } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { groupBy, mergeMap, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
// const defaultSpecCase = (source, predicate, publisher, expectation, done) => {
const defaultSpecCase = (source, predicate, publisher, asArray, withUnsubscribe, concurrency, elementSelector, durationSelector, subjectSelector, expectation, done) => {
    // test for completion and unsubscription in that order
    let completed = false, unsubscribed = false;
    // group by age
    const example = source.pipe(
        // group the people by age
        groupBy(predicate, elementSelector, durationSelector, subjectSelector, (withUnsubscribe ? () => (unsubscribed = true) : false)),
        // return each item in group as array to collect the items in groups (on completion)
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
describe("fre operator/groupBy functionality", function () {

    // set-up spec showing implementation - inorder to get back to an array/stream
    it("should carry-out the groupBy operator and pipe to a single ordered array", function (done) {
        // same as above but returns a single array because "asArray" is set to true (runs an additional map back to array over each boundary group)
        // also skips out on setting additional "unsubscribe" method to cover the case when one isnt set
        defaultSpecCase(new Observable(helpers.withPeople), person => person.age, undefined, true, false, undefined, undefined, undefined, undefined, [
            { name: "Sue", age: 25 }, { name: "Frank", age: 25 },
            { name: "Sarah", age: 35 },
            { name: "Joe", age: 30 }
        ], done);
    });

    // set-up spec testing feature-set against Observable
    it("should carry-out the groupBy operator with an Observable as source", function (done) {
        defaultSpecCase(new Observable(helpers.withPeople), person => person.age, undefined, false, false, undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Sarah", age: 35 }],
            [{ name: "Joe", age: 30 }]
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the groupBy operator with an Subject as source", function (done) {
        // same as the first case but against a Subject
        defaultSpecCase(new Subject(), person => person.age, helpers.withPeople, false, true, undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Sarah", age: 35 }],
            [{ name: "Joe", age: 30 }]
        ], done);
    });

    // set-up spec testing feature-set against BehaviourSubject
    it("should carry-out the groupBy operator with an BehaviourSubject as source", function (done) {
        // same as the first case but against a BehaviourSubject - *note that undefined isnt present because the predicate ignores unmatched entries
        defaultSpecCase(new BehaviourSubject(), person => person && person.age, helpers.withPeople, false, true, undefined, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [{ name: "Sarah", age: 35 }],
            [{ name: "Joe", age: 30 }]
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the groupBy operator with an async Subject as source", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response
        // (* note that because the Subject has no backpressure any late subscribers (caused by the concat) will miss the messages being emitted by the bucket operator)
        defaultSpecCase(new Subject(), person => person.age, helpers.withPeopleOverTime, false, true, 1, undefined, undefined, undefined, [
            [{ name: "Sue", age: 25 }, { name: "Frank", age: 25 }],
            [],
            []
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the groupBy operator with an async Subject as source and a durationSelector", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response
        // however we also issue a durationSelector which unsubscribes the chain on first message - the first message of the durationSelector comes before
        // any message out of the bucket - so everything is received empty
        defaultSpecCase(new Subject(), person => person.age, helpers.withPeopleOverTime, false, true, 1, undefined, () => helpers.observableTimeout, undefined, [
            [],
            [],
            []
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the groupBy operator with an async Subject as source and a SubjectSelector Factory which replays all emitted", function (done) {
        // asynchronously emits all people into boundaries and subscribes to the boundaries using concatMap to return a single response of mapped entries (using elementSelector)
        defaultSpecCase(new Subject(), person => person.age, helpers.withPeopleOverTime, false, true, 1, (message, boundary) => Object.assign(message, { boundary: boundary }), undefined, () => new ReplaySubject(), [
            [{ name: "Sue", age: 25, boundary: 25 }, { name: "Frank", age: 25, boundary: 25 }],
            [{ name: "Sarah", age: 35, boundary: 35 }],
            [{ name: "Joe", age: 30, boundary: 30 }]
        ], done);
    });

    // set-up spec testing feature-set against Subject
    it("should carry-out the groupBy operator with an async Subject as source and a single SubjectSelector which replays all emitted", function (done) {
        // this covers an unlikely case - a single subject shared between groups which also skips out on the default boundary altogether
        defaultSpecCase(new Subject(), person => person.age, helpers.withPeopleOverTime, false, true, 1, undefined, undefined, new ReplaySubject(), [
            [{ name: "Sue", age: 25 }, {"name":"Sarah","age":35}, { name: "Joe", age: 30 }, { name: "Frank", age: 25 }],
            [{ name: "Sue", age: 25 }, {"name":"Sarah","age":35}, { name: "Joe", age: 30 }, { name: "Frank", age: 25 }],
            [{ name: "Sue", age: 25 }, {"name":"Sarah","age":35}, { name: "Joe", age: 30 }, { name: "Frank", age: 25 }]
        ], done);
    });


});
