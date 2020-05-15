# Fre.js - [F]unctional [Re]active Programming library

![CircleCI](https://img.shields.io/circleci/build/gh/gdixon/fre.js/master.svg?style=for-the-badge&token=e8f98a51ce30c29ebffd779ff7fcc43eaee162e5)
![Codecov](https://img.shields.io/codecov/c/github/gdixon/fre.js/master.svg?style=for-the-badge&token=HA6EDXX9NE)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
![npm](https://img.shields.io/npm/v/@gdixon/fre?style=for-the-badge)
![npm bundle size](https://img.shields.io/bundlephobia/min/@gdixon/fre?style=for-the-badge)

Fre is a Functional Reactive Programming (FRP) library much like [RxJS](https://github.com/ReactiveX/rxjs), with a slight alteration to the Observer signature: where RxJS's Observable.subscribe exposes; next, error and complete - Fre's Observable.subscribe exposes; next, error, complete and **unsubscribe**.

In RxJS if you wanted to hook into the unsusbcribe event you would add a teardown to the returned Subscription after subscribing, Fre rolls "unsubscribe" into the core Subscribe signature and adds additional unsubscribe methods to all Operators (usually suplied as the final argument) allowing for less pure useage and finer control over shared artifacts.

Fre's Multicasting Operators (share, publish, etc...) also support additional methods for onConnect, onDisconnect, onSubscribe and onUnsubscribe which serve to expose the multicasting lifecycle to the outside world. They can be used to mirror the refCount recycling procedure to the outside so that we can manage our own clean-up for when a multicasted Subject is retired.

Fre is written in javascript rather than typescript and covers just a subset of RxJS Operators, [click here](#operator) to see whats included.

For more details on specific usecases please check our [tests](https://github.com/gdixon/fre.js/blob/master/spec) for implementation details.

## Getting Started

```
npm install @gdixon/fre --save
```

### Constructing and subscribing to an Observable

```
// import Observable from the root of fre
import { Observable } from "@gdixon/fre"

// create a new Observable and define its Publisher
const observable = new Observable((subscriber) => {
    // emit message to the subscriber
    subscriber.next("message");
    // complete the subscriber inside the publisher
    subscriber.complete();
});

// subscribe an Observer to the Observerable (which will pass the Observer (wrapped in a Subscriber) through the Publisher)
observable.subscribe((message) => {
    console.log(message);
}, (err) => {
    console.log(err);
}, () => {
    console.log("completed");
}, () => {
    console.log("unsubscribed");
});

/*
    logs:
    $ message
    $ completed
    $ unsubscribed
/*
```

### Constructing and subscribing to a Subject

```
// import Subject from the root of fre
import { Subject } from "@gdixon/fre"

// create a new Subject
const subject = new Subject();

// Publisher can be defined after the Observable/Subject has been constructed...
subject.setPublisher(function(subscriber) {

    // return a teardown fn to be added to the subscribers teardowns
    return () => {
        console.log("subscriber teardown");
    }
});

// any messages sent before subscription will be lost
subject.next("lost");

// subscribe an Observer to the Subject
subject.subscribe((message) => {
    console.log(message);
}, (err) => {
    console.log(err);
}, () => {
    console.log("completed");
}, () => {
    console.log("unsubscribed");
});

// emit message to the subject (and all subscribers)
subject.next("message");

// complete all subscribers which are subscribed to the subject
subject.complete();

/*
    logs:
    $ message
    $ completed
    $ subscriber teardown
    $ unsubscribed
/*
```

### Constructing and subscribing to a BehaviourSubject

```
// import BehaviourSubject from the root of fre
import { BehaviourSubject } from "@gdixon/fre"

// create a BehaviourSubject with an initial value of "message"
const subject = new BehaviourSubject("message");

// setting a publisher will overide any previously set publisher using the decorator pattern
subject.setPublisher(function (subscriber, publisher) {
    // call to the original publisher (to invoke BehaviourSubjects publisher)
    publisher.call(this, subscriber);

    // return a teardown fn to be added to the subscribers teardowns
    return () => {
        console.log("subscriber teardown");
    }
});

// subscribing to the BehaviourSubject will emit the last value the BehaviourSubject saw to the new Subscriber
subject.subscribe((message) => {
    console.log(message);
}, (err) => {
    console.log(err);
}, () => {
    console.log("completed");
}, () => {
    console.log("unsubscribed");
});

// complete all subscribers which are subscribed to the subject
subject.complete();

/*
    logs:
    $ message
    $ completed
    $ subscriber teardown
    $ unsubscribed
/*
```

### Constructing and subscribing to a ReplaySubject

```
// import ReplaySubject from the root of fre
import { ReplaySubject } from "@gdixon/fre"

// create a ReplaySubject (with no buffer invalidation rules)
const subject = new ReplaySubject();

// setting a publisher will overide any previously set publisher using the decorator pattern
subject.setPublisher(function (subscriber, publisher) {
    // call to the original publisher (to invoke ReplaySubjects publisher)
    publisher.call(this, subscriber);

    // return a teardown fn to be added to the subscribers teardowns
    return () => {
        console.log("subscriber teardown");
    }
});

// subscribing to the ReplaySubject would replay any messages already received (but nothing has been received yet)
subject.subscribe((message) => {
    console.log("sub1", message);
}, (err) => {
    console.log(err);
}, () => {
    console.log("completed1");
}, () => {
    console.log("unsubscribed1");
});

// emit message to the subject (and all subscribers) buffering the message for future subscriptions
subject.next("message1");

// Publisher will emit the buffered message
subject.subscribe((message) => {
    console.log("sub2", message);
}, (err) => {
    console.log(err);
}, () => {
    console.log("completed2");
}, () => {
    console.log("unsubscribed2");
});

// emit message to the subject (and all subscribers) buffering a second message
subject.next("message2");

// complete all subscribers which are subscribed to the subject
subject.complete();

/*
    logs:
    $ sub1 message1
    $ sub2 message1
    $ sub1 message2
    $ sub2 message2
    $ completed1
    $ subscriber teardown
    $ unsubscribed1
    $ completed2
    $ subscriber teardown
    $ unsubscribed2
/*
```

### Constructing and subscribing to piped Operators against an Observable

_Operators always start with a lowercase and Observable constructors always start with an uppercase_

```
// import Of from Observable creation methods
import { Of } from "@gdixon/fre/observable"

// import map and reduce as Operators
import { map, reduce } from "@gdixon/fre/operator"

// create an Observable which will emit 1-4
const observable = Of(1,2,3,4);

// pipe the values through Operators to build a new message stream
const sumOfPlusOne = observable.pipe(map((value) => {

    return value + 1;
}), reduce((carr, value) => {

    return carr + value;
}));

// subscribe to the computed stream
sumOfPlusOne.subscribe((value) => {
    console.log(value);
});

/*
    logs:
    $ 14
/*
```

_map, filter and reduce are also aliased against the Observable itself without needing to use the pipe method..._

```
// import Of from Observable creation methods
import { Of } from "@gdixon/fre/observable"

// create an Observable which will emit 1-4
const observable = Of(1,2,3,4);

// pipe the values through Operators to build a new message stream
const sumOfPlusOne = observable.map((value) => {

    return value + 1;
}).reduce((carr, value) => {

    return carr + value;
});

// subscribe to the computed stream
sumOfPlusOne.subscribe((value) => {
    console.log(value);
});

/*
    logs:
    $ 14
/*
```

## Lists of Fre modules

### <a name="root"></a>List of all root level modules ./* (``` import { * } from "@gdixon/fre" ```)

- Observable
- Subject
- ReplaySubject
- BehaviourSubject
- Observer
- Subscriber
- Subscription
- Scheduler

### <a name="operator"></a>List of all Operator/* modules (``` import { * } from "@gdixon/fre/operator" ```)

- bucket
- concat
- concatAll
- concatMap
- concatMapTo
- delay
- filter
- first
- groupBy
- last
- map
- mapTo
- merge
- mergeAll
- mergeMap
- mergeMapTo
- multicast
- operator
- pairwise
- publisher
- publishBehaviour
- publishReplay
- reduce
- scan
- share
- shareBehaviour
- shareReplay
- skip
- skipUntil
- skipWhile
- skipWith
- switchFor
- switchAll
- switchMap
- switchMapTo
- take
- takeUntil
- takeWhile
- tap
- toArray

### <a name="observable"></a>List of all Observable/* creation modules (``` import { * } from "@gdixon/fre/observable" ```)

- CombineLatest
- Concat
- Connectable
- ForkJoin
- From
- FromArray
- FromAsyncIterable
- FromCallback
- FromEvent
- FromIterable
- FromObservable
- FromPromise
- Interval
- Merge
- Of
- Switch
- Zip

### <a name="scheduler"></a>List of all Scheduler/* queue modules (``` import { * } from "@gdixon/fre/scheduler" ```)

- Animation
- Asap
- Async
- Queue

## Testing

```
npm run test
```

## Coverage

```
npm run coverage
```

## Builds (including all modules)

```
npm run build
```

- Minified and transpiled Commonjs build

  > dist/index.js - 14kb

  > dist/observable/index.js - 17kb

  > dist/operator/index.js - 25kb
  
  > dist/scheduler/index.js - 7kb

- Minified and transpiled IIFE build (for direct inclusion in script tags)

  > dist/fre.iife.js - 32kb

- Transpiled ES5 build (commonjs)

  > dist/es5 - 369kb

- ES6 build (copy of src)

  > dist/es2015 - 377kb

## Versioning

- We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository](https://github.com/explicit/byRef.js/tags).

## Authors

- **Graham Dixon** - _Initial work_ - [GDixon](https://github.com/GDixon)

  See also the list of [contributors](https://github.com/explicit/byRef.js/contributors) who participated in this project.

## License

- This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgements

- RxJS - without RxJS - fre.js would not exist.

  Thank you to everyone who has contributed to making RxJS the fantastic library that it is.
