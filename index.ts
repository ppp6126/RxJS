// const next = (value: any) => console.log("next:", value);
// next("Hello World");

console.clear();

interface Observer {
  next: (value: any) => void;
  error: (err: any) => void;
  complete: () => void;
}
const observer: Observer = {
  next: (value: any) => console.log('next', value),
  error: (err: any) => console.log('error', err),
  complete: () => console.log('complete'),
};
// observer.next("Hello World");
// observer.error("Hello World");
// observer.complete();

type TearDown = () => void;

class Observable {
  subscriber: (observer: Observer) => TearDown;
  constructor(subscriber: (observer: Observer) => TearDown) {
    this.subscriber = subscriber;
  }

  subscribe(observer: Observer) {
    const teardown: TearDown = this.subscriber(observer);
    return { unsubscribe: () => teardown() };
  }
}

// function source(observer: Observer) {
//   let i = 0;
//   const index = setInterval(() => observer.next(i++), 1000);
//   const teardown = () => clearInterval(index);
//   return { unsubscribe: () => teardown() };
// }

function Interval(milisec: number) {
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

// const source = Interval(2000);
// const source = of(10,20,30,40)
const source = from(['banana', 'old banana', 'apple']);

const subscription = source.subscribe(observer);
setTimeout(() => {
  subscription.unsubscribe();
}, 5000);
