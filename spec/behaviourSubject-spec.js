// import chai for testing
import chai from 'chai';
// construct new Observable instances for each test
import { BehaviourSubject } from "../src";

describe("fre BehaviourSubject functionality", function () {

    // set-up spec testing feature-set
    it("should allow for creation of new instances using static create method", function (done) {

        try {
            const subject = BehaviourSubject.create(1, {});
            subject.subscribe((message) => {
                chai.expect(message).to.equal(1);
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


});
