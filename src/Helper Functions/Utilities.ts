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

function checkValid(value: number, is_denom: boolean = false) {
  return value !== null && value !== undefined && is_denom ? value > 0 : true;
}

// A type-level Zip, represented in TS as a mapped type, that maps a tuple of Arrays to the
// associated zipped type.
// For example, it maps types: [Array<number>, Array<string>] -> [number, string].
type Zip<A extends Array<any>> = {
  [K in keyof A]: A[K] extends Array<infer T> ? T : never
}

// The value-level zip function maps input values to output values.
// The type-level Zip function maps input types to output types.
//
// Variadic strongly-typed zip function, taken from:
// https://gist.github.com/briancavalier/62f784e20e4fffc4d671126b7f91bad0
function zip<Arrays extends Array<any>[]>(...arrays: Arrays): Array<Zip<Arrays>> {
  const len = Math.min(...arrays.map(a => a.length))
  // TS needs a hint or it infers zipped as any[].
  const zipped: Zip<Arrays>[] = new Array(len)
  for (let i = 0; i < len; i++) {
    // TS needs a hint to know that the map result is of the right type.
    zipped[i] = arrays.map(a => a[i]) as Zip<Arrays>
  }
  return zipped
}

export {
  rep,
  seq,
  checkValid,
  zip
};
