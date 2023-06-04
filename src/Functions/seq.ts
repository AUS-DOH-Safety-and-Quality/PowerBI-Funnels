function seq(from: number, to: number, by: number): number[] {
  const n_iter: number = Math.floor((to - from) / by);
  const res: number[] = new Array<number>(n_iter);
  res[0] = from;
  for (let i: number = 1; i < n_iter; i++) {
    res[i] = res[i-1] + by;
  }
  return res;
}

export default seq;
