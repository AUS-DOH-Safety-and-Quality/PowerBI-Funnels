function checkValidInput(numerator: number, denominator: number, data_type: string): boolean {
  let numeratorValid: boolean = numerator !== null && numerator !== undefined;
  let denominatorValid: boolean = denominator !== null && denominator !== undefined && denominator > 0;
  let proportionDenominatorValid: boolean = data_type === "PR" ? numerator <= denominator : true;
  return numeratorValid && denominatorValid && proportionDenominatorValid;
}

export default checkValidInput;
