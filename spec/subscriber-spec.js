// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Subscriber, Observer } from "../src";

describe("fre Subscriber functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {
        try {
            const subscriber = Subscriber.create((message) => {
                chai.expect(message).to.equal(1);
                done();
            });
            // push message through
            subscriber.next(1);
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should not forward any messages if subscriber is closed", function (done) {
        try {
            let messaged = 0;
            const subscriber = Subscriber.create((message) => {
                messaged++;
                chai.expect(message).to.equal(1);
            });
            // push message through
            subscriber.next(1);
            // complete the subscriber
            subscriber.unsubscribe();
            // push message through
            subscriber.next(1);
            // check that we only sent one message
            chai.expect(messaged).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for the Observer to be fed predefined", function (done) {
        try {
            let messaged = 0;
            const subscriber = Subscriber.create(new Observer((message) => {
                messaged++;
                chai.expect(message).to.equal(1);
            }));
            // push message through
            subscriber.next(1);
            // check that we only sent one message
            chai.expect(messaged).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for errors to propagate once through to Observer", function (done) {
        try {
            let errors = 0;
            const subscriber = Subscriber.create(() => {
                done("failed");
            }, (e) => {
                errors++;
                chai.expect(e).to.equal("error");
            });
            // push error through
            subscriber.error("error");
            // push error through
            subscriber.error("error");
            // expect to have hit error once
            chai.expect(errors).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should catch error thrown by the complete method", function (done) {
        try {
            let errors = 0;
            const subscriber = Subscriber.create(() => {
                done("failed");
            }, (e) => {
                errors++;
                chai.expect(e).to.equal("error");
            }, () => {
                throw("error");
            });
            // push error through
            subscriber.complete();
            // calling complete again shoult have no effect
            subscriber.complete();
            // expect to have hit error once
            chai.expect(errors).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });
    
    // set-up spec testing feature-set
    it("should not unsubscribe if defined as an operator and error is thrown", function (done) {
        try {
            let unsubscribed = false;
            const subscriber = Subscriber.create(() => {
                throw("error")
            }, undefined, undefined, () => {
                unsubscribed = true;
            });
            // when the operator errors it should not forward to unsubscribe
            subscriber.operator = true;
            // push message through
            subscriber.next(1);
            // expect unsubscribed to still be false
            chai.expect(unsubscribed).to.equal(false);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should not unsubscribe if defined as an operator and complete is called", function (done) {
        try {
            let completed = false, unsubscribed = false;
            const subscriber = Subscriber.create(undefined, undefined, () => {
                completed = true;
            }, () => {
                unsubscribed = true;
            });
            // when the operator errors it should not forward to unsubscribe
            subscriber.operator = true;
            // push message through
            subscriber.complete();
            // expect unsubscribed to still be false
            chai.expect(completed == true && unsubscribed == false && subscriber.closed == false).to.equal(true);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for the complete state to be fed via unsubscribe as param", function (done) {
        try {
            let unsubscribed = false;
            const subscriber = Subscriber.create(undefined, undefined, undefined, () => {
                unsubscribed = true;
            });
            // when the operator errors it should not forward to unsubscribe
            subscriber.operator = true;
            subscriber.isStopped = true;
            // push message through
            subscriber.unsubscribe(false);
            // expect unsubscribed to still be false
            chai.expect(unsubscribed == true && subscriber.closed == false).to.equal(true);
            done();
        } catch (e) {
            done(e);
        }
    });

});
