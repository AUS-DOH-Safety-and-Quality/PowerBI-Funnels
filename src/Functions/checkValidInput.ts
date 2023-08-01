export default function checkValidInput(numerator: number, denominator: number, data_type: string): boolean {
  const numeratorValid: boolean = numerator !== null && numerator !== undefined;
  const denominatorValid: boolean = denominator !== null && denominator !== undefined && denominator > 0;
  const proportionDenominatorValid: boolean = data_type === "PR" ? numerator <= denominator : true;
  return numeratorValid && denominatorValid && proportionDenominatorValid;
}
