// import chai for testing
import chai from 'chai';
// Concat with new Observables constructed for each test
import { Observable, Connectable, Subscriber } from "../../src/fre.js";
// pipe the resultant stream to toArray to get a single testable output
import { toArray } from "../../src/operator";
// import Observer helpers to build out test cases
import { helpers } from "../helpers/publishers.js";

// set-up spec testing feature-set
describe("fre Observable/Connectable functionality", function() {

    // set-up spec testing feature-set
    it("should delay subscription to source until connect", function (done) {
        let actionHappened = false, actionCompleted = false, connectableConstructed = false, connectableConnected = false, connectableDisconnected = false, connectableSubscribed = 0, connectableUnsubscribed = 0;
        // concat target1 and target1
        const target = new Observable(helpers.withComplete);
        // carry out the concat on the targets and pipe to array
        const connectable = Connectable.create(target.pipe(toArray()), undefined, {
            onConstruct: () => {
                connectableConstructed = true;
            },
            onConnect: () => {
                connectableConnected = true;
            },
            onDisconnect: () => {
                connectableDisconnected = true;
            },
            onSubscribe: () => {
                connectableSubscribed++;
            },
            onUnsubscribe: () => {
                connectableUnsubscribed++;
            }
        });
        // expect to match
        const expectation = "[1,2,3,4]";
        // place a subscription to carry out the work
        connectable.subscribe((message) => {
            // mark that the action happened
            actionHappened = true;
            chai.expect(JSON.stringify(message)).to.equal(expectation);
        }, (e) => {
            done(e);
        }, () => {
            actionCompleted = true;
        });
        // check state before connect
        chai.expect(actionHappened).to.equal(false);
        chai.expect(connectableConstructed).to.equal(true);
        chai.expect(connectableConnected).to.equal(false);
        chai.expect(connectableDisconnected).to.equal(false);
        chai.expect(connectableSubscribed).to.equal(1);
        chai.expect(connectableUnsubscribed).to.equal(0);
        // connect the subject to the source
        connectable.connect();
        // calling again does nothing
        connectable.connect();
        // check state before connect
        chai.expect(actionHappened && actionCompleted).to.equal(true);
        chai.expect(connectableConstructed).to.equal(true);
        chai.expect(connectableConnected).to.equal(true);
        chai.expect(connectableDisconnected).to.equal(true);
        chai.expect(connectableSubscribed).to.equal(1);
        chai.expect(connectableUnsubscribed).to.equal(1);
        // when all targets are complete then the operator should finish
        done();
    });

    // set-up spec testing feature-set
    it("should allow unsubscription before connect - but it wont run onDisconnect", function (done) {
        let actionHappened = false, actionCompleted = false, connectableConstructed = false, connectableConnected = false, connectableDisconnected = false, connectableSubscribed = 0, connectableUnsubscribed = 0;
        // concat target1 and target1
        const target = new Observable(helpers.withComplete);
        // carry out the concat on the targets and pipe to array
        const connectable = Connectable.create(target.pipe(toArray()), undefined, {
            onConstruct: () => {
                connectableConstructed = true;
            },
            onConnect: () => {
                connectableConnected = true;
            },
            onDisconnect: () => {
                connectableDisconnected = true;
            },
            onSubscribe: () => {
                connectableSubscribed++;
            },
            onUnsubscribe: () => {
                connectableUnsubscribed++;
            }
        });
        // place a subscription to carry out the work
        const subscription = connectable.subscribe(new Subscriber(() => {
            // mark that the action happened
            actionHappened = true;
        }, (e) => {
            done(e);
        }, () => {
            actionCompleted = true;
        }));
        // drop the subscription
        subscription.unsubscribe();
        // check state before connect
        chai.expect(actionHappened || actionCompleted).to.equal(false);
        chai.expect(connectableConstructed).to.equal(true);
        chai.expect(connectableConnected).to.equal(false);
        chai.expect(connectableDisconnected).to.equal(false);
        chai.expect(connectableSubscribed).to.equal(1);
        chai.expect(connectableUnsubscribed).to.equal(1);
        // when all targets are complete then the operator should finish
        done();
    });

    // set-up spec testing feature-set
    it("should allow for the multicasted instance to be replaced during runtime", function (done) {
        // should call out to reconnect once
        let refCount = 0, reconnected = 0;
        // concat target1 and target1
        const target = new Observable(helpers.withoutComplete);
        // carry out the concat on the targets and pipe to array
        const connectable1 = Connectable.create(target.pipe(toArray()), undefined, {
            refCount: true,
            onConnect: function() { 
                refCount++;
            },
            onReconnect: function() {
                reconnected++;
            }
        });
        // carry out the concat on the targets and pipe to array
        const connectable2 = Connectable.create(target.pipe(toArray()), undefined, {
            refCount: true,
            onReconnect: function () {
                
                // replacement can only be made on reconnect (should point to a connectable instance?)
                return connectable1;
            }
        });
        // create a subscription onto the shared subject
        const sub1 = connectable1.subscribe(() => { });
        // create a subscription onto the shared subject
        const sub2 = connectable2.subscribe(() => { });
        // record initial subject positions
        const connectable1_subject1 = connectable1._subject.observer;
        const connectable2_subject1 = connectable2._subject.observer;
        // drop subscription to retire the subject
        sub1.unsubscribe(); sub2.unsubscribe();
        // expect sub to have been dropped
        chai.expect(connectable1_subject1.observers.length).to.equal(0);
        chai.expect(connectable2_subject1.observers.length).to.equal(0);
        // resubscribe to connectable2 and expect connection to be forwarded to connectable1
        const sub3 = connectable1.subscribe(() => {  });
        // resubscribe to connectable2 and expect connection to be forwarded to connectable1
        const sub4 = connectable2.subscribe(() => {  });
        // record initial subject positions
        const connectable1_subject2 = connectable1._subject.observer;
        const connectable2_subject2 = connectable2._subject.observer;
        // expect the connectable2 instances subject to be replaced by the connectable1's
        chai.expect(connectable1_subject1).to.not.equal(connectable2_subject1);
        // expect that the new arrays are equal
        chai.expect(connectable1_subject2).to.equal(connectable2_subject2);
        // expect both active subscriptions to appear on connectable 1
        chai.expect(connectable1_subject2.observers.length).to.equal(2);
        chai.expect(connectable2_subject1.observers.length).to.equal(0);
        // refCount will record both subscriptions
        chai.expect(refCount).to.equal(2);
        // the reconnected var only saw one reconnection (when sub3 subscribed)
        chai.expect(reconnected).to.equal(1);

        // when all targets are complete then the operator should finish
        done();
    });
});
