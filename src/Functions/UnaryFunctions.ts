import * as math from '@stdlib/math/base/special';

function broadcast_unary(fun: (x: number) => number) {
  return function<T extends number | number[]>(y: T): T {
    if (typeof y === "number") {
      return fun(y) as T;
    } else if (Array.isArray(y)) {
      return y.map(d => fun(d)) as T;
    }
  };
}

const sqrt = broadcast_unary(math.sqrt);
const exp = broadcast_unary(math.exp);
const log = broadcast_unary(Math.log);
const asin = broadcast_unary(Math.asin);
const square = broadcast_unary((x) => math.pow(x, 2));
const inv = broadcast_unary((x) => 1.0 / x);

export {
  sqrt,
  square,
  exp,
  inv,
  asin,
  log
};
