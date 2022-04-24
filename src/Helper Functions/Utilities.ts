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

function checkValidInput(numerator: number, denominator: number, data_type: string) {
  let numeratorValid: boolean = numerator !== null && numerator !== undefined;
  let denominatorValid: boolean = denominator !== null && denominator !== undefined && denominator > 0;
  let proportionDenominatorValid: boolean = data_type === "PR" ? numerator < denominator : true;
  return numeratorValid && denominatorValid && proportionDenominatorValid;
}

function extractValues(valuesArray: number[], indexArray: number[]): number[] {
  return valuesArray.filter((d,idx) => indexArray.indexOf(idx) != -1)
}

export {
  rep,
  seq,
  checkValidInput,
  extractValues
};
