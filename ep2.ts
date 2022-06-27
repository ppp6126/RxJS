// const next = (value: any) => console.log("next:", value);
// next("Hello World");

console.clear();

interface Observer {
  next: (value: any) => void;
  error: (err: any) => void;
  complete: () => void;
}

// observer.next("Hello World");
// observer.error("Hello World");
// observer.complete();

type TearDown = () => void;
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
    this.teardownList.forEach(teardown => teardown());
    this.teardownList = [];
  }
}
class Observable {
  subscriber: (observer: Observer) => TearDown;
  constructor(subscriber: (observer: Observer) => TearDown) {
    this.subscriber = subscriber;
  }

  subscribe(observer: Observer) {
    const teardown: TearDown = this.subscriber(observer);
    const subscription = new Subscription(teardown);
    return subscription;
    // return { unsubscribe: () => teardown() };
  }
}

// function source(observer: Observer) {
//   let i = 0;
//   const index = setInterval(() => observer.next(i++), 1000);
//   const teardown = () => clearInterval(index);
//   return { unsubscribe: () => teardown() };
// }

function fromPromise<T>(promise: Promise<T>) {
  return new Observable(observer => {
    let closed = false;
    promise
      .then(data => {
        if (!closed) {
          observer.next(data);
          observer.complete();
        }
      })
      .catch(err => {
        observer.error(err);
      });

    return () => {
      closed = true;
    };
  });
}

function Interval(milisec: number) {
  return new Observable(observer => {
    let i = 0;
    const index = setInterval(() => observer.next(i++), milisec);
    const teardown = () => clearInterval(index);
    return teardown;
  });
}

function of(...dataList: any[]) {
  return new Observable(observer => {
    dataList.forEach(data => observer.next(data));
    observer.complete();
    return () => {};
  });
}

function from(dataList: any[]) {
  return new Observable(observer => {
    dataList.forEach(data => observer.next(data));
    observer.complete();
    return () => {};
  });
}

const observer1: Observer = {
  next: (value: any) => console.log("observer1 next", value),
  error: (err: any) => console.log("observer1 error", err),
  complete: () => console.log("observer1 complete")
};
const observer2: Observer = {
  next: (value: any) => console.log("observer2 next", value),
  error: (err: any) => console.log("observer2 error", err),
  complete: () => console.log("observer2 complete")
};

const promiseNaja = fetch("https://www.anapioficeandfire.com/api/books/1", {
  method: "GET"
});

// const source = Interval(2000);
// const source = of(10,20,30,40)
// const source = from(["banana", "old banana", "apple"]);
const subscription = new Subscription();
// subscription.add(Interval(1000).subscribe(observer1));
// subscription.add(Interval(1000).subscribe(observer2));

const book$ = fromPromise(promiseNaja);
book$.subscribe(observer1);

// const subscription = source.subscribe(observer);
setTimeout(() => {
  subscription.unsubscribe();
  // subscription.unsubscribe();
  // subscription1.unsubscribe();
  // subscription2.unsubscribe();
}, 5000);
