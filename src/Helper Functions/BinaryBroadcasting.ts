import * as math from '@stdlib/math/base/special';

function broadcast_binary(fun: (x: number, y: number) => any) {
    return function<T1 extends number | number[],
                    T2 extends number | number[]>(x: T1, y: T2) {
        if(Array.isArray(x) && Array.isArray(y)) {
            return x.map((d, idx) => fun(d, y[idx]));
        } else if(Array.isArray(x) && !Array.isArray(y)) {
            return x.map((d) => fun(d, y));
        } else if(!Array.isArray(x) && Array.isArray(y)) {
            return y.map((d) => fun(x, d));
        } else if (typeof x === "number" && typeof y === "number") {
            return fun(x, y);
        }
    };
}

const pow = broadcast_binary(math.pow);
const add = broadcast_binary((x, y) => x + y);
const subtract = broadcast_binary((x, y) => x - y);
const divide = broadcast_binary((x, y) => x / y);
const multiply = broadcast_binary((x, y) => x * y);
const all_equal = broadcast_binary((x, y) => x == y);

export { pow };
export { subtract };
export { add };
export { divide };
export { multiply };
export { all_equal };
