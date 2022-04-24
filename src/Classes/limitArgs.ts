type limitArgsConstructorT = {
  q?: number;
  target?: number;
  target_transformed?: number;
  SE?: number;
  tau2?: number;
  denominator?: number;
}

class limitArguments {
  q: number;
  target: number;
  target_transformed: number;
  SE: number;
  tau2: number;
  denominator: number;

  constructor(args: limitArgsConstructorT) {
    this.q = args.q;
    this.target = args.target;
    this.target_transformed = args.target_transformed;
    this.SE = args.SE;
    this.tau2 = args.tau2;
    this.denominator = args.denominator;
  }
}

export default limitArguments;
