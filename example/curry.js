var curry = require('lodash').curry;

var match = curry((what, str) => {
  return str.match(what);
})

console.log(match(/\s+/g, "hello world"));
console.log(match(/\s+/g)("hello world"));
