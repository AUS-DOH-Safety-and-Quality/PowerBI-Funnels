import * as math from '@stdlib/math/base/special';

function broadcast_unary(fun: (x: any) => any) {
    return function(x: any) {
        if(Array.isArray(x)) {
            return x.map(d => fun(d));
        } else {
            return fun(x);
        }
    };
}

function broadcast_binary(fun: (x: any, y:any) => any) {
    return function(x: any, y: any) {
        if(Array.isArray(x) && Array.isArray(y)) {
            return x.map((d, idx) => fun(d, y[idx]));
        } else if(Array.isArray(x) && !Array.isArray(y)) {
            return x.map((d) => fun(d, y));
        } else if(!Array.isArray(x) && Array.isArray(y)) {
            return y.map((d) => fun(x, d));
        } else {
            return fun(x, y);
        }
    };
}

const sqrt = broadcast_unary(math.sqrt);
const exp = broadcast_unary(math.exp);
const pow = broadcast_binary(math.pow);
const square = broadcast_unary((x) => math.pow(x, 2));
const add = broadcast_binary((x, y) => x + y);
const subtract = broadcast_binary((x, y) => x - y);
const divide = broadcast_binary((x, y) => x / y);
const multiply = broadcast_binary((x, y) => x * y);
const all_equal = broadcast_binary((x, y) => x == y);

function rep(x: number, n: number) : number[] {
    return Array.apply(null, Array(n)).map(d => x)
}

function seq(from: number, to: number, by: number): number[] {
    let n_iter: number = Math.floor((to - from) / by);
    let res: number[] = new Array<number>(n_iter);
    res[0] = from;
    for (let i: number = 1; i < n_iter; i++) {
        res[i] = res[i-1] + by;
    }
    return res; 
}

export { sqrt };
export { square };
export { pow };
export { subtract };
export { add };
export { divide };
export { multiply };
export { exp };
export { rep };
export { all_equal };
export { seq };
