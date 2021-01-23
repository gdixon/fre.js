// import chai for testing
import chai from 'chai';
import sinon from 'sinon';
// construct new Observable instances for each test
import { Scheduler } from "../src/fre.js";

describe("fre Scheduler functionality", function () {

    // set-up spec testing feature-set
    it("should allow assement of time using static method", function (done) {
        // spy on Date.now so that we can check it was called
        const spy = sinon.stub(Date, 'now');
        // call to static method on scheduler (.now())
        try {
            Scheduler.now();
        } catch (e) {
            done(e);
        } finally {
            // expect for the static method to call Data.now()
            chai.expect(spy.calledOnce).to.equal(true);
            // done with test
            done();
        }
    });

    // set-up spec testing feature-set
    it("should allow assement of time using instances method", function (done) {
        let instance = null, one = 0, two = 0, calls = 0;
        try {
            // create a scheduler with a now method which increments on each call
            instance = new Scheduler(undefined, () => ++calls);
            one = instance.now();
            two = instance.now();
        } catch (e) {
            done(e);
        } finally {
            chai.expect(one).to.equal(1);
            chai.expect(two).to.equal(2);
            // expect to have called the method twice
            chai.expect(calls).to.equal(2);
            done();
        }
    });

    // set-up spec testing feature-set
    it("should allow assement of time using instances method which is provided as a constant int", function (done) {
        let instance = null, one = 0, two = 0;
        try {
            // create a scheduler with a now method which increments on each call
            instance = new Scheduler(undefined, 1);
            // will receive one both calls
            one = instance.now();
            two = instance.now();
        } catch (e) {
            done(e);
        } finally {
            chai.expect(one).to.equal(1);
            chai.expect(two).to.equal(1);
            done();
        }
    });

    // set-up spec testing feature-set
    it("should return false if extreme delay is given", function (done) {
        let instance = null, test = true;
        try {
            // create a scheduler with a now method which increments on each call
            instance = new Scheduler(undefined);
            // will cancel subscription because the delay is out of bounds
            test = instance.schedule(() => {}, true, Number.POSITIVE_INFINITY)
        } catch (e) {
            done(e);
        } finally {
            chai.expect(test).to.equal(false);
            done();
        }
    });

    // set-up spec testing feature-set
    it("should allow assement of time using instances method", function (done) {
        // test that the scheduler forwards state and delay to the actions schedule method after creating a new Action with the parent scheduler and given work
        let work = () => {}, instance = null, response = null;
        // create an action to test that the scheduler will forward details accordingly
        class MockAction {

            constructor(scheduler, work) {
                // record the provided details
                this.scheduler = scheduler;
                this.work = work;
            }
        
            schedule(state, delay) {
                
                // returns everything that we was given (does no work - usually an action would schedule a flush here...)
                return {
                    state: state,
                    delay: delay,
                    work: this.work,
                    scheduler: this.scheduler
                }
            }
        }
        // attempt to create the scheduler and schedule work onto it...
        try {
            // create a scheduler with a now method which increments on each call
            instance = new Scheduler(MockAction);
            // scheduler the work (state=true, delay=10)
            response = instance.schedule(work, true, 10);
        } catch (e) {
            done(e);
        } finally {
            // check that everything is returned to the response from the intenral MockAction.schedule call
            chai.expect(response && response.state).to.equal(true);
            chai.expect(response && response.delay).to.equal(10);
            chai.expect(response && response.work).to.equal(work);
            chai.expect(response && response.scheduler).to.equal(instance);
            chai.expect(true).to.equal(true);
            done();
        }
    });

});
