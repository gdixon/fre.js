// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observable, Subject, BehaviourSubject, ReplaySubject, Async } from "../../src/fre.js";
// import toArray to finalise tests to one output
import { tap, multicast, toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// carry out the same spec procedure with each Observable type
const defaultSpecCase = (observable, publisher, expectation, expectedHits, done) => {
    // track the hits made in tap and how many times the subscription was called
    let hits = 0, replaySubject = new ReplaySubject(undefined, 1, Async);
    // construct counters so that we can test all parts of the selectored multicast
    let originalPublishers = 0, constructs = 0, connects = 0, subscribed = 0, unsubscribed = 0, disconnects = 0;
    // this publisher will be build upon the subjects publisher
    replaySubject.setPublisher(function (observer, publisher) {
        // mark that the publisher on the replaySubject will be called with each subscription
        originalPublishers++;
        // call the original publisher - this is the point we're replayed messages are emitted...
        if (publisher) publisher.call(this, observer);
    });
    // consruct a multicast - note that this subscribes on creation
    const multicasted = observable.pipe(tap(() => {
        // mark how many times we hit the shared element
        hits++;
    }), multicast(replaySubject, toArray(), {
        // allow for auto connect/disconnect
        refCount: true,
        // intercept all additional methods to show usage
        onConstruct: () => {
            constructs++;
        },
        onSubscribe: function () {
            subscribed++;
        },
        onUnsubscribe: function () {
            unsubscribed++;
        },
        onConnect: () => {
            connects++;
        },
        onDisconnect: () => {
            disconnects++;
        },
    }));
    // carry out the subscriptions to the multicast after feeding the buffer
    multicasted.subscribe(function (message) {
        // check the counts
        chai.expect(originalPublishers).to.equal(1);
        chai.expect(constructs).to.equal(1);
        chai.expect(connects).to.equal(1);
        chai.expect(subscribed).to.equal(1);
        chai.expect(unsubscribed).to.equal(0);
        chai.expect(disconnects).to.equal(0);
        // first subscription always fills the buffer and sends the message through
        chai.expect(hits).to.equal(expectedHits);
        // message should always be the same
        chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation));
    }, (e) => {
        done(e);
    }, undefined, function () {
        chai.expect(unsubscribed).to.equal(1);
    });
    // apply the publisher if present
    if (publisher) publisher(observable);
    // subscribe to the multicast again - this will always hit the replay subject
    multicasted.subscribe((message) => {
        // check the counts
        chai.expect(originalPublishers).to.equal(2);
        chai.expect(constructs).to.equal(1);
        chai.expect(connects).to.equal(1);
        chai.expect(subscribed).to.equal(2);
        chai.expect(unsubscribed).to.equal(1);
        chai.expect(disconnects).to.equal(1);
        // hits is not incremented this run in any type because the replay completes after sending buffer and then resubscribes (filling the buffer again if called against an - 
        // Observable expect third run to have double hits)
        chai.expect(hits).to.equal(expectedHits);
        // Observable will replay the messages in buffer and complete - then subscribe and buffer new messages
        chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation));
    }, (e) => {
        done(e);
    }, undefined, () => {
        chai.expect(unsubscribed).to.equal(2);
    });
    // subscribe again to the empty subject (not closed)
    multicasted.subscribe((message) => {
        // check the counts
        chai.expect(originalPublishers).to.equal(3);
        chai.expect(constructs).to.equal(1);
        chai.expect(connects).to.equal(1);
        chai.expect(subscribed).to.equal(3);
        chai.expect(unsubscribed).to.equal(2);
        chai.expect(disconnects).to.equal(1);
        // expectation is dependent on the Observable type being tested...
        if (!publisher) {
            // Observable will replay the messages in buffer and complete - then subscribe and buffer new messages - hits was called again by sub2
            chai.expect(hits).to.equal(expectedHits * 2);
            // message is 2 * expectation (buffer from sub1 and buffer from sub2)
            chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation.concat(expectation)));
        } else {
            // Subjects/BehaviourSubjects returns the expected message and hits every time (until cleared by windowTimer)
            chai.expect(hits).to.equal(expectedHits);
            chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation));
        }
    }, (e) => {
        done(e);
    }, undefined, () => {
        chai.expect(unsubscribed).to.equal(3);
    });
    // after timeout there will be no messages present on the queue so this subscription would not be called until a new message is streamed
    setTimeout(() => {
        // subscribe again to the empty subject (not closed)
        multicasted.subscribe((message) => {
            // check the counts
            chai.expect(originalPublishers).to.equal(4);
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(4);
            chai.expect(unsubscribed).to.equal(3);
            chai.expect(disconnects).to.equal(1);
            // expectation is dependent on the Observable type being tested...
            if (!publisher) {
                // hits was incremented by sub3 to === 3*expectation
                chai.expect(hits).to.equal(expectedHits * 3);
                // Observable posts empty because it was cleared by the windowTimer -- however carrying out this work buffers the next set
                chai.expect(JSON.stringify(message)).to.equal("[]");
            } else {
                // Subjects/BehaviourSubjects always post empty (emptied by windowTime (never refilled))
                chai.expect(hits).to.equal(expectedHits);
                // Subjects/BehaviourSubjects will not refill the buffer - because they are marked as isStopped after source completes
                chai.expect(JSON.stringify(message)).to.equal("[]");
            }
        }, (e) => {
            done(e)
        }, undefined, () => {
            chai.expect(unsubscribed).to.equal(4);
        });
        // unsubscribe the source after this subscription...
        multicasted.subscribe((message) => {
            // check the counts
            chai.expect(originalPublishers).to.equal(5);
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(5);
            chai.expect(unsubscribed).to.equal(4);
            chai.expect(disconnects).to.equal(1);
            // expectation is dependent on the Observable type being tested...
            if (!publisher) {
                // Observable source will resubscribe after every subscription and refill the buffer untill unsubscribe
                chai.expect(hits).to.equal(expectedHits * 4);
                chai.expect(JSON.stringify(message)).to.equal(JSON.stringify(expectation));
            } else {
                // Subjects/BehaviourSubjects always post empty (emptied by windowTime (never refilled))
                chai.expect(hits).to.equal(expectedHits);
                chai.expect(JSON.stringify(message)).to.equal("[]");
            }
        }, (e) => {
            // failed - throw error through done
            done(e);
        }, undefined, () => {
            // check the final counts
            chai.expect(originalPublishers).to.equal(5);
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(5);
            chai.expect(unsubscribed).to.equal(5);
            chai.expect(disconnects).to.equal(1);
        });
        if (!publisher) {
            // because the source does not complete - we expect to have subscribed but not unsubscribed
            chai.expect(subscribed + unsubscribed).to.equal(5);
        } else {
            // because the source completes - we expect both the subscribed and unsubscribed to equal 5
            chai.expect(subscribed + unsubscribed).to.equal(10);
        }
        // finsihed with done]
        done();
    });
};

describe("fre operator/multicast functionality", function () {

    // set-up spec testing feature-set
    it("should carry-out the multicast operator against an Observable", function (done) {
        // the source completes and fills the buffer on first subscription, second message replays from buffer and fills buffer with next
        // timeout puts after the windowTimer and the messages are cleared - however we do buffer a new message which is picked up by the next subscription
        defaultSpecCase(new Subject(helpers.withoutComplete), undefined, [1, 2, 3, 4], 4, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the multicast operator against a Subject", function (done) {
        // the source completes and fills the buffer on first subscription, second subscription replays the buffer inside the time window but because the source was a subject
        // and subjects cannot be resubscribed the buffer is not filled again with another message. Any subsequent subscriptions will receive the emptied buffer (emptied by timeWindow)
        defaultSpecCase(new Subject(), helpers.withComplete, [1, 2, 3, 4], 4, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the multicast operator against a BehaviourSubject", function (done) {
        // the source completes and fills the buffer on first subscription, second subscription replays the buffer inside the time window but because the source was a subject
        // and subjects cannot be resubscribed the buffer is not filled again with another message. Any subsequent subscriptions will receive the emptied buffer (emptied by timeWindow)
        defaultSpecCase(new BehaviourSubject(), helpers.withComplete, [null, 1, 2, 3, 4], 5, done);
    });

    // set-up spec testing feature-set
    it("should carry-out the multicast operator against an Observable which does not complete", function (done) {
        // construct an observable which never completes (this could be any hot Observable type (Subject etc))
        const observable = new Observable(helpers.withoutComplete);
        // track the hits made in tap and how many times the subscription was called
        let called = 0, taps = 0, hits = 0, replaySubject = new ReplaySubject(undefined, 1, Async);
        // construct counters so that we can test all parts of the selectored multicast
        let constructs = 0, connects = 0, subscribed = 0, unsubscribed = 0, disconnects = 0;
        // consruct a multicast - note that this subscribes on creation
        const multicasted = observable.pipe(tap(() => {
            // mark how many times we hit the shared element
            taps++;
        }), multicast(replaySubject, tap(() => {
            // mark how many times we hit the shared element
            hits++;
        }), {
            // allow for auto connect/disconnect
            refCount: true,
            // intercept all additional methods to show usage
            onConstruct: () => {
                constructs++;
            },
            onSubscribe: function () {
                subscribed++;
            },
            onUnsubscribe: function () {
                unsubscribed++;
            },
            onConnect: () => {
                connects++;
            },
            onDisconnect: () => {
                disconnects++;
            }
        }));
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            // check the counts
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(1);
            chai.expect(unsubscribed).to.equal(0);
            chai.expect(disconnects).to.equal(0);
            // hits is not incremented this run in any type because the replay completes after sending buffer and then subscribes (expect third run to have double hits)
            chai.expect(hits).to.equal(++called);
            // outer and inner will be called with new messages - once outer has emitted all messages only the inner will replay
            chai.expect(taps).to.equal(called);
        }, (e) => {
            done(e);
        }, undefined, () => {
            chai.expect(unsubscribed).to.equal(1);
        });
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            // check the counts
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(2);
            chai.expect(unsubscribed).to.equal(0);
            chai.expect(disconnects).to.equal(0);
            // hits is not incremented this run in any type because the replay completes after sending buffer and then subscribes (expect third run to have double hits)
            chai.expect(hits).to.equal(++called);
            // outer will be called once and will be replayed to the inner
            chai.expect(taps).to.equal(4);
        }, (e) => {
            done(e);
        }, undefined, () => {
            chai.expect(unsubscribed).to.equal(2);
        });
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            // check the counts
            chai.expect(constructs).to.equal(1);
            chai.expect(connects).to.equal(1);
            chai.expect(subscribed).to.equal(3);
            chai.expect(unsubscribed).to.equal(0);
            chai.expect(disconnects).to.equal(0);
            // hits is not incremented this run in any type because the replay completes after sending buffer and then subscribes (expect third run to have double hits)
            chai.expect(hits).to.equal(++called);
            // outer will be called once and will be replayed to the inner
            chai.expect(taps).to.equal(4);
        }, (e) => {
            done(e);
        }, undefined, () => {
            chai.expect(unsubscribed).to.equal(3);
        });
        // drop all subscriptions
        replaySubject.unsubscribe();
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            done("should not call next if the Subject closed");
        }, (e) => {
            done(e);
        }, () => {
            done("should not complete");
        }, () => {
            // finsihed with done]
            done();
        });
    });

    // set-up spec testing feature-set
    it("should carry-out the multicast operator against an Observable without being provided options", function (done) {
        // create an observable that completes 
        const observable = new Observable(helpers.withComplete);
        // track the hits made in tap and how many times the subscription was called
        let called = 0, taps = 0, hits = 0, replaySubject = new ReplaySubject(undefined, 1, Async);
        // consruct a multicast - note that this subscribes on creation
        const multicasted = observable.pipe(tap(() => {
            // mark how many times we hit the shared element
            taps++;
        }), multicast(replaySubject, tap(() => {
            // mark how many times we hit the shared element
            hits++;
        })));
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            // hits is not incremented this run in any type because the replay completes after sending buffer and then subscribes (expect third run to have double hits)
            chai.expect(hits).to.equal(++called);
            // outer and inner will be called with new messages - once outer has emitted all messages only the inner will replay
            chai.expect(taps).to.equal(called);
        }, (e) => {
            done(e);
        });
        // subscribe to the multicast again - this will always hit the replay subject
        multicasted.subscribe(() => {
            // hits is not incremented this run in any type because the replay completes after sending buffer and then subscribes (expect third run to have double hits)
            chai.expect(hits).to.equal(++called);
            // outer and inner will be called with new messages - once outer has emitted all messages only the inner will replay
            chai.expect(taps).to.equal(4);
        }, (e) => {
            done(e);
        }, () => {
            // drop the replay subject
            replaySubject.unsubscribe();
            // finsihed with done]
            done();
        });
    });

});

