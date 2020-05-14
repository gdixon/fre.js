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
});
