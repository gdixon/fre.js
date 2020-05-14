// import chai for testing
import chai from 'chai';
// FromEvent to create a new Observable for each test
import { FromEvent } from "../../src";

// set-up spec testing feature-set
describe("fre Observable/FromEvent functionality", function() {

    // set-up spec testing feature-set
    it("should carry-out the fromEvent method from Observable", function (done) {
        // create an element to test against and a dummy eventListener to simulate browser implementation
        const node = {}, listeners = {}, event = {type:"keydown", test: true};
        // dummy DOM eventListener cycle (add and dispatch - no need)
        node.addEventListener = (key, listener) => (listeners[key] = (listeners[key] ? listeners[key] : [])).push(listener);
        // drop the listener if it exists
        node.removeEventListener = (key, listener) => (listeners[key] && listeners[key].indexOf(listener) != -1 ? listeners[key].splice(listeners[key].indexOf(listener), 1) : false)
        // simple event dispatcher against the type established in the event
        node.dispatchEvent = (event) => (listeners[event.type] ? listeners[event.type].forEach((fn) => fn(event)) : false);
        // build Observable from event listener - *note that the listener isnt created until a subscription is made
        const sub1 = FromEvent(node, "keydown").subscribe((message) => {
            // the dummy nodes event cycle doesnt carry true events - if it did it wouldnt look like this...
            chai.expect(message).to.equal(event);
        }, (e) => {
            // throw away on error and fail
            done(e);
        }, undefined, () => {
            // ensure the listener was dropped
            chai.expect(listeners["keydown"].length).to.equal(1);
        });
        // place another subscription which also receives the same event but via a project method
        const sub2 = FromEvent(node, "keydown", (message) => {

            // simple selector - this just places the message (event) inside an object
            return {
                event: message
            }
        }).subscribe((message) => {
            // the dummy nodes event cycle doesnt carry true events - if it did it wouldnt look like this...
            chai.expect(message.event).to.equal(event);
        }, (e) => {
            // throw away on error and fail
            done(e);
        }, undefined, () => {
            // ensure the listener was dropped
            chai.expect(listeners["keydown"].length).to.equal(0);
            // finsihed with done]
            done();
        });
        // dispatch event against dummyEl
        node.dispatchEvent(event);
        // unsubscribe the observables (which will remove the event listeners)
        sub1.unsubscribe(); sub2.unsubscribe();
    });
    
});
