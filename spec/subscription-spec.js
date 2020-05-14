// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Subscription } from "../src";

describe("fre Subscription functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {
        try {
            let unsubscribed = false;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed = true;
            });
            // drop the subscription
            subscription.unsubscribe();
            // dropped on first unsub
            chai.expect(unsubscribed).to.equal(true);
            // drop the subscription
            subscription.unsubscribe();
            // check the teardown method was called
            chai.expect(unsubscribed).to.equal(true);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for additional teardowns to be added after construct", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add(() => { unsubscribed++; })
            // drop the subscription
            subscription.unsubscribe();
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(2);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should dispose of additional teardowns as soon as theyre added if we're already in closed state", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // drop the subscription
            subscription.unsubscribe();
            // unsubed 1
            chai.expect(unsubscribed).to.equal(1);
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add(() => { unsubscribed++; })
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(2);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for subscription to be set as an additional teardown operation", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // register final unsub method on construct
            const subscription2 = Subscription.create(() => {
                unsubscribed++;
            });
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add(subscription2)
            // drop the subscription
            subscription.unsubscribe();
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(2);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for subscription to be set as an additional teardown operation even if it was closed before being added", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // register final unsub method on construct
            const subscription2 = Subscription.create(() => {
                unsubscribed++;
            });
            // drop sub2 before adding to subscription
            subscription2.unsubscribe();
            // subscription2 is now closed
            chai.expect(subscription2.closed === true).to.equal(true);
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add(subscription2)
            // drop the subscription
            subscription.unsubscribe();
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(2);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for teardown to be removed before unsubscribing", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // register final unsub method on construct
            const subscription2 = Subscription.create(() => {
                unsubscribed++;
            });
            // add another 2 methods which should be dropped on unsubscribe
            const remove = subscription.add(subscription2);
            // drop the teardown
            remove();
            // second drop would have no effect
            remove();
            // drop the subscription
            subscription.unsubscribe();
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should skip teardown if the item is not teardownable", function (done) {
        try {
            let unsubscribed = 0;
            // register final unsub method on construct
            const subscription = Subscription.create(() => {
                unsubscribed++;
            });
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add(true)
            // drop the subscription
            subscription.unsubscribe(false);
            // doesnt mark as unsubscribed if false is passed as closed state
            chai.expect(subscription.closed === false).to.equal(true);
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for disposal of an array of methods", function (done) {
        try {
            let unsubscribed = 0;
            // register without final unsub method on construct
            const subscription = Subscription.create();
            // add another 2 methods which should be dropped on unsubscribe
            subscription.add([
                () => { unsubscribed++; },
                () => { unsubscribed++; },                
            ])
            // drop the subscription
            subscription.unsubscribe();
            // marked as unsubscribed if no state is passed to unsubscribe
            chai.expect(subscription.closed === true).to.equal(true);
            // check all teardown methods were called
            chai.expect(unsubscribed).to.equal(2);
            done();
        } catch (e) {
            done(e);
        }
    });

});
