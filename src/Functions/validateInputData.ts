import { validateRows, type RowRule, type RowValidation } from "powerbi-visuals-core/data";

export type ValidationT = RowValidation;

export default function validateInputData(keys: readonly (string | undefined)[], numerators: readonly (number | undefined)[],
  denominators: readonly (number | undefined)[], data_type: string): ValidationT {
  const rules: RowRule[] = [
    { fails: i => keys[i] === undefined, message: "Group missing", all: "All Groups/IDs are missing or null!" },
    { fails: i => numerators[i] === undefined, message: "Numerator missing", all: "All numerators are missing or null!" },
    { fails: i => isNaN(numerators[i] as number), message: "Numerator is not a number", all: "All numerators are not numbers!" },
    { fails: i => (numerators[i] as number) < 0, message: "Numerator negative", all: "All numerators are negative!" },
    { fails: i => denominators[i] === undefined, message: "Denominator missing", all: "All denominators missing or null!" },
    { fails: i => isNaN(denominators[i] as number), message: "Denominator is not a number", all: "All denominators are not numbers!" },
    { fails: i => !Number.isFinite(denominators[i]), message: "Denominator is not finite", all: "All denominators are not finite!" },
    { fails: i => (denominators[i] as number) < 0, message: "Denominator negative", all: "All denominators are negative!" },
    { fails: i => denominators[i] === 0, message: "Denominator is zero", all: "All denominators are zero!" }
  ];
  if (data_type === "PR") {
    rules.push({
      fails: i => !((denominators[i] as number) >= (numerators[i] as number)),
      message: "Denominator < numerator", all: "All denominators are smaller than numerators!"
    });
  }
  return validateRows(keys.length, rules);
}
