# Fre.js - [F]unctional [Re]active Programming library

![CircleCI](https://img.shields.io/circleci/build/gh/gdixon/fre.js/master.svg?style=flat-square&token=e8f98a51ce30c29ebffd779ff7fcc43eaee162e5)
![Codecov](https://img.shields.io/codecov/c/github/gdixon/fre.js/master.svg?style=flat-square&token=HA6EDXX9NE)
![Bundled size](https://img.badgesize.io/https://unpkg.com/@gdixon/fre/fre.bundle.js?label=bundled&style=flat-square)
![NPM version](https://img.shields.io/npm/v/@gdixon/fre?label=version&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?label=license&style=flat-square)

## Preamble

Fre is an exercise in repeating and expanding on a proven experiment. 

The core of Fre is almost the same as [RxJS](https://github.com/ReactiveX/rxjs), and serves the same purpose, Fre is a module library which enables Functional Reactive Programming (FRP), with a slight alteration to the Observer/Subscriber signature as well as hosting a more liberal multicasting interface. 

## Detailed Introduction

In RxJS if you wanted to hook into the ```unsusbcribe``` event you would add a teardown to the returned ```Subscription``` after subscribing, Fre rolls ```"unsubscribe"``` into the core ```Observer``` signature and adds additional ```.unsubscribe``` methods to all Operators (usually suplied as the final argument) allowing for finer control over shared artifacts (this goes against the functional programming manifesto, but can be useful when used with restraint): where RxJS's Observer exposes; ```.next```, ```.error``` and ```.complete``` - Fre's Observer exposes; ```.next```, ```.error```, ```.complete``` and **```.unsubscribe```**.

Fre's ```multicast``` Operators (```share```, ```publish```, etc...) support options for the following additional methods; ```.onConnect()```, ```.onDisconnect()```, ```.onReconnect()```, ```.onSubscribe()``` and ```.onUnsubscribe()```, which serve to expose the multicasting lifecycle to the outside. They can be used to mirror the ```refCount``` procedure so that the consumer can manage its own clean-up, ```refCount``` has also been remounted as an option as opposed to a seperate ```Operator``` to make usage more direct and explicit.

Fre is written in Javascript (as a feature) rather than Typescript and covers just a subset of the Operators that RxJS covers ([click here](#operator) to see whats included), however because the singature is virtual the same, Fre should be able to consume RxJS operators without the need for any changes.

Please check the [tests](https://github.com/gdixon/fre.js/blob/master/spec) for more specific implementation details.

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
*/
```

### Constructing and subscribing to a Subject

```
// import Subject from the root of fre
import { Subject } from "@gdixon/fre"

// create a new Subject
const subject = new Subject();

// Publisher can (optionally) be defined after the Observable/Subject has been constructed...
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
*/
```

### Constructing and subscribing to a BehaviourSubject

```
// import BehaviourSubject from the root of fre
import { BehaviourSubject } from "@gdixon/fre"

// create a BehaviourSubject with an initial value of "message"
const subject = new BehaviourSubject("message");

// Setting a Publisher will overide the internal Publisher and any other previously set Publishers using the *decorator pattern 
// *(each new publisher in the chain should invoke or replace the previous one)
subject.setPublisher(function (subscriber, publisher) {
    // call to the original publisher (to invoke BehaviourSubjects internal publisher)
    publisher.call(this, subscriber);

    // return a teardown fn to be added to the subscribers teardowns
    return () => {
        console.log("subscriber teardown");
    }
});

// subscribing to the BehaviourSubject will emit the last value the BehaviourSubject received to the new Subscriber
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
*/
```

### Constructing and subscribing to a ReplaySubject

```
// import ReplaySubject from the root of fre
import { ReplaySubject } from "@gdixon/fre"

// create a ReplaySubject (with no buffer invalidation rules)
const subject = new ReplaySubject();

// Setting a Publisher will overide the internal Publisher and any other previously set Publishers using the *decorator pattern 
// *(each new publisher in the chain should invoke or replace the previous one)
subject.setPublisher(function (subscriber, publisher) {
    // call to the original publisher (to invoke ReplaySubjects internal publisher)
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
*/
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
*/
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
*/
```

## List of Fre's modules

### <a name="root"></a>@gdixon/fre

- Observable
- Subject
- ReplaySubject
- BehaviourSubject
- Observer
- Subscriber
- Subscription
- Scheduler

### <a name="operator"></a>@gdixon/fre/operator

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

### <a name="observable"></a>@gdixon/fre/observable

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

### <a name="scheduler"></a>@gdixon/fre/scheduler

- Animation
- Asap
- Async
- Queue

## Testing

```
npm run test[:watch]
```

## Coverage

```
npm run coverage[:watch]
```

## Lint

```
npm run lint[:fix]
```

## Builds (cjs/es5/es2015 and bundles to fre.bundle.js)

```
npm run build
```

## Versioning

- We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository](https://github.com/explicit/byRef.js/tags).

## Contributors

- **Graham Dixon** - _Initial work_ - [GDixon](https://github.com/GDixon)

  See also the list of [contributors](https://github.com/gdixon/fre.js/CONTRIBUTORS.md) who participated in this project.

## License

- This project is licensed under the MIT License - see the [license](https://github.com/gdixon/fre.js/LICENSE) file for details

## Acknowledgements

- [RxJS](https://github.com/ReactiveX/rxjs) - A reactive programming library for JavaScript (with thanks to [Ben Lesh](https://github.com/benlesh) and all [RxJS contributors](https://github.com/ReactiveX/rxjs/graphs/contributors))
