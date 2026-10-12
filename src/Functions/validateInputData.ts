import {
  validateRows, missingRule, nanRule, negativeRule, ratioRule, quantity, type RowRule, type RowValidation
} from "powerbi-visuals-core/data";
import type { settingsValueType } from "../settings";

export type ValidationT = RowValidation;

export default function validateInputData(keys: readonly (string | undefined)[], numerators: readonly (number | undefined)[],
  denominators: readonly (number | undefined)[], data_type: settingsValueType["funnel"]["chart_type"]): ValidationT {
  const rules: RowRule[] = [
    missingRule(keys, { name: "Group", plural: "Groups/IDs" }),
    missingRule(numerators, quantity.numerator),
    nanRule(numerators, quantity.numerator),
    negativeRule(numerators, quantity.numerator),
    missingRule(denominators, quantity.denominator),
    nanRule(denominators, quantity.denominator),
    { fails: i => !Number.isFinite(denominators[i]), message: "Denominator is not finite", all: "All denominators are not finite!" },
    negativeRule(denominators, quantity.denominator),
    { fails: i => denominators[i] === 0, message: "Denominator is zero", all: "All denominators are zero!" }
  ];
  if (data_type === "PR") {
    rules.push(ratioRule(numerators, denominators));
  }
  return validateRows(keys.length, rules);
}
