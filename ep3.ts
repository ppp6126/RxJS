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

function doubleRequestBook() {
  return new Observable(observer => {
    const book1$ = fromPromise(
      fetch("https://www.anapioficeandfire.com/api/books/1", {
        method: "GET"
      })
    );
    const book2$ = fromPromise(
      fetch("https://www.anapioficeandfire.com/api/books/1", {
        method: "GET"
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
        }
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
        }
      })
    );

    return () => {
      subscription.unsubscribe();
    };
  });
}

function forkJoin(sourceList: Observable[]) {
  return new Observable(observer => {
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
          }
        })
      );
    });

    return () => {
      subscription.unsubscribe();
    };
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

const book1$ = fromPromise(
  fetch("https://www.anapioficeandfire.com/api/books/1", {
    method: "GET"
  })
);
const book2$ = fromPromise(
  fetch("https://www.anapioficeandfire.com/api/books/1", {
    method: "GET"
  })
);
const book3$ = fromPromise(
  fetch("https://www.anapioficeandfire.com/api/books/3", {
    method: "GET"
  })
);
// const source = Interval(2000);
// const source = of(10,20,30,40)
// const source = from(["banana", "old banana", "apple"]);
const subscription = new Subscription();

// const source = doubleRequestBook();
const source = forkJoin([book1$, book2$, book3$]);
source.subscribe(observer1);
// subscription.add(Interval(1000).subscribe(observer1));
// subscription.add(Interval(1000).subscribe(observer2));

// const book$ = fromPromise(promiseNaja);
// book$.subscribe(observer1);

// const subscription = source.subscribe(observer);
setTimeout(() => {
  subscription.unsubscribe();
  // subscription.unsubscribe();
  // subscription1.unsubscribe();
  // subscription2.unsubscribe();
}, 5000);