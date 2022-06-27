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

function fromPromise<T>(promise: Promise<T>) {
  return new Observable((observer) => {
    let closed = false;
    promise
      .then((data) => {
        if (!closed) {
          observer.next(data);
          observer.complete();
        }
      })
      .catch((err) => {
        observer.error(err);
      });

    return () => {
      closed = true;
    };
  });
}

function interval(milisec: number) {
  return new Observable((observer) => {
    let i = 0;
    const index = setInterval(() => observer.next(i++), milisec);
    const teardown = () => clearInterval(index);
    return teardown;
  });
}

function of(...dataList: any[]) {
  return new Observable((observer) => {
    dataList.forEach((data) => observer.next(data));
    observer.complete();
    return () => {};
  });
}

function from(dataList: any[]) {
  return new Observable((observer) => {
    dataList.forEach((data) => observer.next(data));
    observer.complete();
    return () => {};
  });
}

function doubleRequestBook() {
  return new Observable((observer) => {
    const book1$ = fromPromise(
      fetch('https://www.anapioficeandfire.com/api/books/1', {
        method: 'GET',
      })
    );
    const book2$ = fromPromise(
      fetch('https://www.anapioficeandfire.com/api/books/1', {
        method: 'GET',
      })
    );
    const buffer = [];
    let completeActive = 0;
    const subscription = new Subscription();
    subscription.add(
      book1$.subscribe({
        next: (value: any) => (buffer[0] = value),
        error: (err: any) => observer.error(err),
        complete: () => {
          completeActive++;
          if (completeActive === 2) {
            observer.next(buffer);
            observer.complete();
          }
        },
      })
    );
    subscription.add(
      book2$.subscribe({
        next: (value: any) => (buffer[1] = value),
        error: (err: any) => observer.error(err),
        complete: () => {
          completeActive++;
          if (completeActive === 2) {
            observer.next(buffer);
            observer.complete();
          }
        },
      })
    );

    return () => {
      subscription.unsubscribe();
    };
  });
}

function forkJoin(sourceList: Observable[]) {
  return new Observable((observer) => {
    const buffer = [];
    let completeActive = 0;
    const subscription = new Subscription();
    sourceList.forEach((source, index) => {
      subscription.add(
        source.subscribe({
          next: (value: any) => (buffer[index] = value),
          error: (err: any) => observer.error(err),
          complete: () => {
            completeActive++;
            if (completeActive === sourceList.length) {
              observer.next(buffer);
              observer.complete();
            }
          },
        })
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  });
}

function mapTo(anyMapValue: any) {
  return (source: Observable) =>
    new Observable((observer) => {
      console.log('subscribe!');
      const subscription = source.subscribe({
        next: (value) => {
          observer.next(anyMapValue);
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

function map(fn: (value: any) => any) {
  return (source: Observable) =>
    new Observable((observer) => {
      console.log('subscribe!');
      const subscription = source.subscribe({
        next: (value) => {
          const newValue = fn(value);
          observer.next(newValue);
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

const subscription = new Subscription();
const source = interval(1000);
const subject = new Subject();
source.subscribe(subject);

subject.subscribe(observer1);
subject.subscribe(observer2);
setTimeout(() => subject.subscribe(observer3), 5000);

setTimeout(() => {
  subscription.unsubscribe();
}, 5000);
