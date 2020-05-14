// test the subject using Observables
import { Observable } from "../../src";
// test timings on asynchronous tests by skipping until value is === 2 (to delay the starting point)
import { skipWhile } from "../../src/operator";

// emits an error which will call error then unsubscribe on the subscriber
const withError = () => {
    // will be intercepted by the subscriber and error will be reported accordingly
    throw("error");
};

// emit 1-4 then complete synchronously
const withComplete = (subscriber) => {
    // emit 1-4 to the subscriber
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    // complete after emitting 1-4
    subscriber.complete();
};

// emits 1-4 synchronously and dont complete
const withoutComplete = (subscriber) => {
    // emit 1-4 to the subscriber
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
};

// emit 1-4 then complete asynchronously
const withTimeout = (subscriber) => {
    // emit 1-4 to the subscriber asychronously
    subscriber.next(1);
    setTimeout(() => {
        subscriber.next(2);
        setTimeout(() => {
            subscriber.next(3);
            setTimeout(() => {
                subscriber.next(4);
                // complete after emitting 1-4
                setTimeout(() => {
                    subscriber.complete();
                });
            });
        });
    });
};

// Observable which emits error on subscribe
const observableError = (new Observable(withError));

// Observable which immediately emits using the withTimeout subscribe method
const observableTimeout = (new Observable(withTimeout));

// Observable which does not start emiting till the message value is === 2 (used to test asynchronous delays)
const observableTimeoutSkips = observableTimeout.pipe(skipWhile((message) => message <= 2));

// emit some people and their ages
const withPeople = (subscriber) => {
    // each person is unique and fits into an age bracket
    subscriber.next({ name: "Sue", age: 25 });
    subscriber.next({ name: "Sarah", age: 35 });
    subscriber.next({ name: "Joe", age: 30 });
    subscriber.next({ name: "Frank", age: 25 });
    // complete after emitting all people
    subscriber.complete();
};

// emit some people and their ages
const withPeopleOverTime = (subscriber) => {
    // each person is unique and fits into an age bracket
    subscriber.next({ name: "Sue", age: 25 });
    setTimeout(() => {
        subscriber.next({ name: "Sarah", age: 35 });
        setTimeout(() => {
            subscriber.next({ name: "Joe", age: 30 });
            setTimeout(() => {
                subscriber.next({ name: "Frank", age: 25 });
                // complete after emitting all people
                setTimeout(() => {
                    subscriber.complete();
                });
            });
        });
    });
};

export const helpers = {
    withError: withError,
    withComplete: withComplete,
    withoutComplete: withoutComplete,
    withTimeout: withTimeout,
    withPeople: withPeople,
    withPeopleOverTime: withPeopleOverTime,
    observableError: observableError,
    observableTimeout: observableTimeout,
    observableTimeoutSkips: observableTimeoutSkips,
}