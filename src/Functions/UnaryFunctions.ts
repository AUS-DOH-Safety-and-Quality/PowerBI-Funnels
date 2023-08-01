type ReturnT<InputT, BaseT> = InputT extends Array<any> ? BaseT[] : BaseT;

export default function broadcast_unary<ScalarInputT, ScalarReturnT>(fun: (x: ScalarInputT) => ScalarReturnT) {
  return function<T extends ScalarInputT | ScalarInputT[]>(y: T): ReturnT<T, ScalarReturnT> {
    if (Array.isArray(y)) {
      return (y as ScalarInputT[]).map((d: ScalarInputT) => fun(d)) as ReturnT<T, ScalarReturnT>;
    } else {
      return fun(y as Extract<T, ScalarInputT>) as ReturnT<T, ScalarReturnT>;
    }
  };
}

export const sqrt = broadcast_unary(Math.sqrt);
export const exp = broadcast_unary(Math.exp);
export const log = broadcast_unary(Math.log);
export const asin = broadcast_unary(Math.asin);
export const square = broadcast_unary((x: number): number => Math.pow(x, 2));
export const inv = broadcast_unary((x: number): number => 1.0 / x);
