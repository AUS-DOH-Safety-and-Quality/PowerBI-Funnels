import type powerbi from "powerbi-visuals-api";
import validateInputData from "./validateInputData";
import type { settingsClass } from "../Classes";
import settingsModel, { defaultSettings, type settingsValueType } from "../settings";
import {
  formatPrimitiveValue, readNumbers, readRowAnnotations, rowWarnings, type RowAnnotations, type ValidatedDataView
} from "powerbi-visuals-core/powerbi";
import { keptPositions, keptValues, type InputDataResult, type ValidRows } from "powerbi-visuals-core/data";

export type dataObject = RowAnnotations<settingsValueType["scatter"], settingsValueType["labels"]> & {
  keys: { x: number; id: number; label: string }[];
  id: number[];
  numerators: number[];
  denominators: number[];
  categories: powerbi.DataViewCategoryColumn;
  warningMessage: string;
  validationStatus: ValidRows;
};

export default function extractInputData(view: ValidatedDataView<"numerators" | "denominators">, inputSettingsClass: settingsClass,
  rows: readonly number[]): InputDataResult<dataObject> {
  const keyColumn = view.categories.key[0];
  const numeratorColumn = view.values.numerators[0];
  const denominatorColumn = view.values.denominators[0];
  const categories = view.category;
  const keys = new Array<string | undefined>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    keys[i] = formatPrimitiveValue(keyColumn.values[rows[i]]);
  }
  const numerators = readNumbers(numeratorColumn, rows);
  const denominators = readNumbers(denominatorColumn, rows);
  const validation = validateInputData(keys, numerators, denominators, inputSettingsClass.settings.funnel.chart_type);
  if (validation.status !== 0) {
    return { status: "invalid", error: validation.error };
  }

  const kept = keptPositions(validation.messages);
  const id = keptValues(rows, kept);
  const labels = keptValues(keys, kept);
  const keyRows = new Array<dataObject["keys"][number]>(kept.length);
  for (let x = 0; x < kept.length; x++) {
    keyRows[x] = { x, id: id[x], label: labels[x] };
  }
  const annotations = readRowAnnotations({
    categorical: view.categorical, values: view.values, categories,
    cards: { scatter: settingsModel.scatter, labels: settingsModel.labels },
    defaults: { scatter: defaultSettings.scatter, labels: defaultSettings.labels }
  }, rows, kept);
  const warnings = rowWarnings(categories.source.displayName, rows, keys, validation.messages,
    { messages: inputSettingsClass.validationStatus.messages, messagePositionByRowIndex: inputSettingsClass.messagePositionByRowIndex });
  return { status: "valid", data: {
    ...annotations, keys: keyRows, id, numerators: keptValues(numerators, kept), denominators: keptValues(denominators, kept), categories,
    warningMessage: warnings.join("\n"), validationStatus: validation
  } };
}
