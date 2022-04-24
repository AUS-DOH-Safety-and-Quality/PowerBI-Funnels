function rep(x: number, n: number) : number[] {
  return Array.apply(null, Array(n)).map(d => x)
}

export default rep;
