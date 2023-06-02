class limitData {
  [key: string]: number;
  denominator: number;
  ll99: number;
  ll95: number;
  ul95: number;
  ul99: number;
  target: number;
  alt_target: number;

  constructor(denominator: number) {
    this.denominator = denominator;
  }
}

export default limitData;
