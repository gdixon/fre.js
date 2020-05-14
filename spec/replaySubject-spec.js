// import chai for testing
import chai from 'chai';
import sinon from 'sinon';
// construct new Observable instances for each test
import { ReplaySubject } from "../src";
// import Observer helpers to build out test cases
import { helpers } from "./helpers/publishers.js";

describe("fre replaySubject functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {

        try {
            const subject = ReplaySubject.create();
            subject.subscribe(undefined,(e) => {
                done(e);
            }, () => {
                done();
            });
            // complete the behaviourSubject
            subject.complete();
        } catch (e) {
            done(e);
        }
    });


    // set-up spec testing feature-set
    it("should allow for bufferSize to control how many messages are stored", function (done) {

        try {
            // start the counter at 2 so that we offset the messages we miss
            let counter = 2;
            // create a replaySubject with a BufferSize of 2
            const subject = ReplaySubject.create(2);
            // prepare the subject with messages
            helpers.withoutComplete(subject);
            // subscribe to the replaySubject - this will only store the last 2 messages it received
            subject.subscribe((message) => {
                // receives messages 3 & 4
                chai.expect(++counter == message).to.equal(true);
            },(e) => {
                done(e);
            }, () => {
                // counter will now be at 4
                chai.expect(counter == 4).to.equal(true);
                done();
            });
            // complete the behaviourSubject
            subject.complete();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for messages to be replayed only inside windowTime", function (done) {
        try {
            // start the counter at 2 so that we offset the messages we miss
            let counter = 0;
            // mock the timer
            const sandbox = sinon.createSandbox();
            const fakeTimer = sandbox.useFakeTimers();
            // create a replaySubject with a BufferSize of 2
            const subject = ReplaySubject.create(undefined, 1);
            // prepare the subject with messages
            helpers.withoutComplete(subject);
            // subscribe to the replaySubject - this will only store the last 2 messages it received
            subject.subscribe((message) => {
                // receives messages 3 & 4
                chai.expect(++counter == message).to.equal(true);
            },(e) => {
                done(e);
            }, () => {
                // counter will now be at 4
                chai.expect(counter == 4).to.equal(true);
            });
            // complete the behaviourSubject
            subject.complete();
            // tick the timer which will clear the buffer
            fakeTimer.tick(1);
            // subscribe to the replaySubject - this will only store the last 2 messages it received
            subject.subscribe(() => {
                done("no messages should be left in the buffer")
            },(e) => {
                done(e);
            }, () => {
                // counter will still be at 4
                chai.expect(counter == 4).to.equal(true);
                done();
            });
            // final action when this operator is unsubscribed
            sandbox.restore();
        } catch (e) {
            done(e);
        }
    });


    // set-up spec testing feature-set
    it("should allow for bufferSize to control how many messages are stored and for messages to be replayed only inside windowTime ", function (done) {
        try {
            // start the counter at 2 so that we offset the messages we miss
            let counter = 2;
            // mock the timer
            const sandbox = sinon.createSandbox();
            const fakeTimer = sandbox.useFakeTimers();
            // create a replaySubject with a BufferSize of 2
            const subject = ReplaySubject.create(2, 1);
            // prepare the subject with messages
            helpers.withoutComplete(subject);
            // subscribe to the replaySubject - this will only store the last 2 messages it received
            subject.subscribe((message) => {
                // receives messages 3 & 4
                chai.expect(++counter == message).to.equal(true);
            },(e) => {
                done(e);
            }, () => {
                // counter will now be at 4
                chai.expect(counter == 4).to.equal(true);
            });
            // complete the behaviourSubject
            subject.complete();
            // tick the timer which will clear the buffer
            fakeTimer.tick(1);
            // subscribe to the replaySubject - this will only store the last 2 messages it received
            subject.subscribe(() => {
                done("no messages should be left in the buffer")
            },(e) => {
                done(e);
            }, () => {
                // counter will still be at 4
                chai.expect(counter == 4).to.equal(true);
                done();
            });
            // final action when this operator is unsubscribed
            sandbox.restore();
        } catch (e) {
            done(e);
        }
    });

});
