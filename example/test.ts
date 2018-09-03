const compose = (...fns: any[]) => fns.reduce((f, g) => (...args: any[]) => f(g(...args)));

const example = compose(
  (val: string) => { console.log(1); return `1<${val}>`; },
  (val: string) => { console.log(2); return `2<${val}>`; },
  (val: string) => { console.log(3); return `3<${val}>`; }
);

console.log(example('hello'));
