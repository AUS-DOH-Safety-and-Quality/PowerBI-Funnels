type ReturnT<InputT, BaseT> = InputT extends Array<any> ? BaseT[] : BaseT;

function broadcast_unary<ScalarInputT, ScalarReturnT>(fun: (x: ScalarInputT) => ScalarReturnT) {
  return function<T extends ScalarInputT | ScalarInputT[]>(y: T): ReturnT<T, ScalarReturnT> {
    if (Array.isArray(y)) {
      return (y as ScalarInputT[]).map((d: ScalarInputT) => fun(d)) as ReturnT<T, ScalarReturnT>;
    } else {
      return fun(y as Extract<T, ScalarInputT>) as ReturnT<T, ScalarReturnT>;
    }
  };
}

const sqrt = broadcast_unary(Math.sqrt);
const exp = broadcast_unary(Math.exp);
const log = broadcast_unary(Math.log);
const asin = broadcast_unary(Math.asin);
const square = broadcast_unary((x: number): number => Math.pow(x, 2));
const inv = broadcast_unary((x: number): number => 1.0 / x);

export {
  sqrt,
  square,
  exp,
  inv,
  asin,
  log
};

export default broadcast_unary;
