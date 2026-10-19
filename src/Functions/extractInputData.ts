import validateInputData from "./validateInputData";
import type { settingsClass } from "../Classes";
import type { settingsValueType } from "../settings";
import { extractRows, formatPrimitiveValue, readNumbers, type InputRows, type ValidatedDataView } from "powerbi-visuals-core/powerbi";
import { keptValue, type InputDataResult } from "powerbi-visuals-core/data";

export type dataObject = InputRows<settingsValueType["scatter"], settingsValueType["labels"]> & {
  readonly keys: { x: number; id: number; label: string }[];
  readonly id: number[];
  readonly numerators: number[];
  readonly denominators: number[];
};

export default function extractInputData(view: ValidatedDataView<"numerators" | "denominators">, inputSettingsClass: settingsClass,
  rows: readonly number[], group = 0): InputDataResult<dataObject> {
  const keyColumn = view.categories.key[0];
  const keys = new Array<string | undefined>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    keys[i] = formatPrimitiveValue(keyColumn.values[rows[i]]);
  }
  const numerators = readNumbers(view.values.numerators[0], rows);
  const denominators = readNumbers(view.values.denominators[0], rows);
  const extracted = extractRows(view, rows, {
    keys,
    validation: validateInputData(keys, numerators, denominators, inputSettingsClass.settings[group].funnel.chart_type),
    rowSettings: inputSettingsClass.rowSettings[group],
    settings: { messages: inputSettingsClass.validationStatus.messages, messagePositionByRowIndex: inputSettingsClass.messagePositionByRowIndex }
  });
  if (extracted.status === "invalid") {
    return extracted;
  }
  const { kept, warnings, ...annotations } = extracted.data;
  const id = new Array<number>(kept.length);
  const keyRows = new Array<dataObject["keys"][number]>(kept.length);
  const keptNumerators = new Array<number>(kept.length);
  const keptDenominators = new Array<number>(kept.length);
  for (let x = 0; x < kept.length; x++) {
    const i = kept[x];
    id[x] = rows[i];
    keyRows[x] = { x, id: rows[i], label: keptValue(keys, i) };
    keptNumerators[x] = keptValue(numerators, i);
    keptDenominators[x] = keptValue(denominators, i);
  }
  return { status: "valid", data: {
    ...annotations, keys: keyRows, id, numerators: keptNumerators, denominators: keptDenominators,
    warningMessage: warnings.join("\n")
  } };
}

/** RC limits centre on log(sum(numerators)), which is undefined without a count */
export function lacksCount(data: dataObject, chartType: settingsValueType["funnel"]["chart_type"]): boolean {
  if (chartType !== "RC") {
    return false;
  }
  for (let i = 0; i < data.numerators.length; i++) {
    if (data.numerators[i] > 0) {
      return false;
    }
  }
  return true;
}
