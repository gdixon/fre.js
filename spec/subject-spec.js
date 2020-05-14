// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Subject, Observer } from "../src";

describe("fre Subject functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {

        try {
            const subject = Subject.create({});
            subject.subscribe(() => {
                done("no messages on subject");
            },(e) => {
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
    it("should immediately unsubscribe if we attempt to subscribe to a completed source Subject", function (done) {
        try {
            const subject = Subject.create({});
            // drop the source subscription (this might be the resultant state after an error)
            subject.unsubscribe();
            // attempt to subscribe to the subject (should immediately be unsusbcribed)
            subject.subscribe(() => {
                done("no messages on subject");
            },(e) => {
                done(e);
            }, () => {
                // done("should not complete");
            }, () => {
                done();
            });
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should immdeiately unsubscribe if we attempt to subscribe to a completed source Subject (with an Observer)", function (done) {
        try {
            const subject = Subject.create({});
            const observer = Observer.create(() => {
                done("no messages on subject");
            },(e) => {
                done(e);
            }, () => {
                // done("should not complete");
            }, () => {
                done();
            });
            subject.complete();
            subject.subscribe(observer);
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should propagate errors through to the subscribers", function (done) {
        try {
            let errors = 0;
            const subject = Subject.create({});
            // attempt to subscribe to the subject (should immediately be unsusbcribed)
            subject.subscribe(() => {
                done("no messages on subject");
            },(e) => {
                errors++;
                chai.expect(e === "error").to.equal(true);
            }, () => {
                done("should not complete");
            });
            // push error through to subscribers
            subject.error("error");
            chai.expect(errors).to.equal(1);
            subject.error("error");
            chai.expect(errors).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should perform no action if unsubscribe is called multiple times", function (done) {
        try {
            let unsubscribed = 0;
            const subject = Subject.create({});
            // attempt to subscribe to the subject (should immediately be unsusbcribed)
            subject.subscribe(() => {
                done("no messages on subject");
            },(e) => {
                done(e);
            }, () => {
                done("should not complete");
            }, () => {
                unsubscribed++;
            });
            subject.unsubscribe();
            chai.expect(unsubscribed).to.equal(1);
            subject.unsubscribe();
            chai.expect(unsubscribed).to.equal(1);
            done();
        } catch (e) {
            done(e);
        }
    });
});
