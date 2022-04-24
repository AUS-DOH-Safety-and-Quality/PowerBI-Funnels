type intervalDataConstructorT = {
  quantile: number;
  label: string;
}

class intervalData {
  quantile: number;
  label: string;

  constructor(args: intervalDataConstructorT) {
    this.quantile = args.quantile;
    this.label = args.label;
  }
}

export default intervalData;
