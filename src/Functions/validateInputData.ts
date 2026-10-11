import { validateRows, type RowRule, type RowValidation } from "powerbi-visuals-core/data";
import type { settingsValueType } from "../settings";

export type ValidationT = RowValidation;

export default function validateInputData(keys: readonly (string | undefined)[], numerators: readonly (number | undefined)[],
  denominators: readonly (number | undefined)[], data_type: settingsValueType["funnel"]["chart_type"]): ValidationT {
  // Rules run in order, so a missing value is reported before its number checks; NaN keeps those false
  const at = (values: readonly (number | undefined)[], i: number): number => values[i] ?? NaN;
  const rules: RowRule[] = [
    { fails: i => keys[i] === undefined, message: "Group missing", all: "All Groups/IDs are missing or null!" },
    { fails: i => numerators[i] === undefined, message: "Numerator missing", all: "All numerators are missing or null!" },
    { fails: i => Number.isNaN(at(numerators, i)), message: "Numerator is not a number", all: "All numerators are not numbers!" },
    { fails: i => at(numerators, i) < 0, message: "Numerator negative", all: "All numerators are negative!" },
    { fails: i => denominators[i] === undefined, message: "Denominator missing", all: "All denominators missing or null!" },
    { fails: i => Number.isNaN(at(denominators, i)), message: "Denominator is not a number", all: "All denominators are not numbers!" },
    { fails: i => !Number.isFinite(denominators[i]), message: "Denominator is not finite", all: "All denominators are not finite!" },
    { fails: i => at(denominators, i) < 0, message: "Denominator negative", all: "All denominators are negative!" },
    { fails: i => denominators[i] === 0, message: "Denominator is zero", all: "All denominators are zero!" }
  ];
  if (data_type === "PR") {
    rules.push({
      fails: i => !(at(denominators, i) >= at(numerators, i)),
      message: "Denominator < numerator", all: "All denominators are smaller than numerators!"
    });
  }
  return validateRows(keys.length, rules);
}
