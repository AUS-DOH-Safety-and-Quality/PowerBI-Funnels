import * as rmath from "lib-r-math.js";



const elt_multiply = rmath.R.multiplex(
    function (x: number, y:number): number {
        return x * y;
    }
);

const subtract = rmath.R.multiplex(
    function (x: number, y:number): number {
        return x - y;
    }
);


const elt_divide = rmath.R.multiplex(
    function (x: number, y:number): number {
        return x / y;
    }
);


const all_equal = rmath.R.multiplex(
    function (x: number, y:number): boolean {
        return x == y;
    }
);

const sqrt = rmath.R.multiplex(Math.sqrt);
const pow = rmath.R.multiplex(Math.pow);

export { elt_multiply };
export { elt_divide };
export { subtract };
export { all_equal };
export { sqrt };
export { pow };