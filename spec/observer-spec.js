// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { Observer } from "../src/fre.js";

describe("fre Observer functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {

        try {
            const observer = Observer.create(undefined,(e) => {
                done(e);
            }, () => {
                done();
            });
            // complete the behaviourSubject
            observer.complete();
        } catch (e) {
            done(e);
        }
    });

    // set-up spec testing feature-set
    it("should allow for unsubscribe to error and trigger", function (done) {
        try {
            // set-up with error and unsub - in all other situations Observers wrapping Subscriber will catch any errors 
            // - but the Observer itself is responsible for catching errors in unsubscribe so that the method isnt called recursively
            const observer = Observer.create(undefined, (e) => {
                // expect the error to flow
                chai.expect(e == "error").to.equal(true);
                done();
            }, undefined, () => {
                throw("error")
            });
            // complete the behaviourSubject
            observer.unsubscribe();
        } catch (e) {
            done(e);
        }
    });

});
