// this module creates Observable instances...
import { Observable } from "../observable.js";

// replace a method thats has a callback with an Observable wrapper around the method (calling wrapper will get Observable with vars)
export const FromCallback = function (input) {

    return (...vars) => {

        return new Observable((observer) => {
            try {
                input(...vars, (...args) => {
                    observer.next(...args);
                });
            } catch (err) {
                observer.error(err);
            } finally {
                observer.complete();
            }
        });
    };
};

// module.exports = FromCallback;