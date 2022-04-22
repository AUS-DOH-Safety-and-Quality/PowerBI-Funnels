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

export {
  rep,
  seq,
  checkValid
};
