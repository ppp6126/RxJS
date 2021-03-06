console.clear();

interface Observer {
  next: (value: any) => void;
  error: (err: any) => void;
  complete: () => void;
}

type TearDown = () => void;
type OperatorFunction = (source: Observable) => Observable;
class Subscription {
  teardownList: TearDown[] = [];
  constructor(teardown?: TearDown) {
    if (teardown) {
      this.teardownList.push(teardown);
    }
  }

  add(subscription: Subscription) {
    this.teardownList.push(() => subscription.unsubscribe());
  }

  unsubscribe() {
    this.teardownList.forEach((teardown) => teardown());
    this.teardownList = [];
  }
}
class Observable {
  subscriber: (observer: Observer) => TearDown;
  constructor(subscriber: (observer: Observer) => TearDown) {
    this.subscriber = subscriber;
  }

  pipe(this: Observable, ...operators: OperatorFunction[]) {
    let source = this;
    operators.forEach((operator) => {
      source = operator(source);
    });
    return source;
  }

  subscribe(observer: Observer) {
    const teardown: TearDown = this.subscriber(observer);
    const subscription = new Subscription(teardown);
    return subscription;
  }
}

class Subject implements Observer {
  private observers: Observer[] = [];

  next(value: any) {
    this.observers.forEach((observer) => observer.next(value));
  }

  error(err: any) {
    this.observers.forEach((observer) => observer.error(err));
  }

  complete() {
    this.observers.forEach((observer) => observer.complete());
  }

  pipe(this: Observable, ...operators: OperatorFunction[]) {
    let source = this;
    operators.forEach((operator) => {
      source = operator(source);
    });
    return source;
  }

  subscribe(observer: Observer) {
    this.observers.push(observer);
    const teardown: TearDown = () => {
      const index = this.observers.findIndex((b) => b === observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
    const subscription = new Subscription(teardown);
    return subscription;
  }
}

function interval(milisec: number) {
  return new Observable((observer) => {
    let i = 0;
    const index = setInterval(() => observer.next(i++), milisec);
    const teardown = () => clearInterval(index);
    return teardown;
  });
}

function tap(fn: (value: any) => void) {
  return (source: Observable) =>
    new Observable((observer) => {
      console.log('subscribe!');
      const subscription = source.subscribe({
        next: (value) => {
          // side effect
          fn(value);
          observer.next(value);
        },
        error: (err) => {
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        },
      });

      return () => {
        console.log('unsubscribe!');
        subscription.unsubscribe();
      };
    });
}

function share({ resetOnRefCountZero } = { resetOnRefCountZero: true }) {
  return (source: Observable) => {
    const subject = new Subject();
    let subscription: Subscription;
    let refCount = 0;
    const connect = () => {
      subscription = source.subscribe(subject);
    };
    const resetOnRefCount = () => {
      if (refCount === 0) {
        if (resetOnRefCountZero === true) {
          subscription.unsubscribe();
          subscription = null;
        }
      }
    };
    return new Observable((observer) => {
      refCount++;
      const subSubscription = subject.subscribe(observer);
      if (!subscription) {
        connect();
      }
      return () => {
        refCount--;
        resetOnRefCount();
        subSubscription.unsubscribe();
      };
    });
  };
}

const observer1: Observer = {
  next: (value: any) => console.log('observer1 next', value),
  error: (err: any) => console.log('observer1 error', err),
  complete: () => console.log('observer1 complete'),
};
const observer2: Observer = {
  next: (value: any) => console.log('observer2 next', value),
  error: (err: any) => console.log('observer2 error', err),
  complete: () => console.log('observer2 complete'),
};
const observer3: Observer = {
  next: (value: any) => console.log('observer3 next', value),
  error: (err: any) => console.log('observer3 error', err),
  complete: () => console.log('observer3 complete'),
};

const observer4: Observer = {
  next: (value: any) => console.log('observer4 next', value),
  error: (err: any) => console.log('observer4 error', err),
  complete: () => console.log('observer4 complete'),
};

const subscription = new Subscription();
const source = interval(1000).pipe(
  tap((val) => console.log('interval ???????????????', val)),
  share({ resetOnRefCountZero: false })
);

// subscription.add(source.subscribe(observer1));
// subscription.add(source.subscribe(observer2));

// setTimeout(() => subscription.add(source.subscribe(observer3)), 5000);

// setTimeout(() => source.subscribe(observer4), 15000);

setTimeout(() => {
  subscription.unsubscribe();
}, 10000);
