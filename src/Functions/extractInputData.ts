import type powerbi from "powerbi-visuals-api";
import validateInputData from "./validateInputData";
import type { settingsClass } from "../Classes";
import settingsModel, { defaultSettings, type settingsValueType } from "../settings";
import {
  formatPrimitiveValue, indexColumnsByRole, readRowAnnotations, rowWarnings, type RowAnnotations
} from "powerbi-visuals-core/powerbi";
import type { ValidationT } from "./validateInputData";

export type dataObject = RowAnnotations<settingsValueType["scatter"], settingsValueType["labels"]> & {
  keys: { x: number; id: number; label: string }[];
  id: number[];
  numerators: number[];
  denominators: number[];
  categories: powerbi.DataViewCategoryColumn;
  warningMessage: string;
  validationStatus: Extract<ValidationT, { status: 0 }>;
};

export type InputDataResult = { status: "valid"; data: dataObject } | { status: "invalid"; error: string };

export default function extractInputData(inputView: powerbi.DataViewCategorical, inputSettingsClass: settingsClass,
  rows?: readonly number[]): InputDataResult {
  const inputSettings = inputSettingsClass.settings;
  const categoryRoles = indexColumnsByRole(inputView.categories ?? []);
  const valueRoles = indexColumnsByRole(inputView.values ?? []);
  const keyColumn = categoryRoles.key?.[0];
  const numeratorColumn = valueRoles.numerators?.[0];
  const denominatorColumn = valueRoles.denominators?.[0];
  const categories = inputView.categories?.[0];
  if (keyColumn === undefined || categories === undefined) return { status: "invalid", error: "No grouping/ID variable passed!" };
  if (numeratorColumn === undefined) return { status: "invalid", error: "No numerators passed!" };
  if (denominatorColumn === undefined) return { status: "invalid", error: "No denominators passed!" };
  const count = keyColumn.values.length;
  if (count !== numeratorColumn.values.length || count !== denominatorColumn.values.length) {
    return { status: "invalid", error: "Groups, numerators and denominators must have matching row counts." };
  }
  if (rows === undefined) {
    const allRows = new Array<number>(count);
    for (let i = 0; i < count; i++) allRows[i] = i;
    rows = allRows;
  }
  const keys = new Array<string | undefined>(rows.length);
  const numerators = new Array<number | undefined>(rows.length);
  const denominators = new Array<number | undefined>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    keys[i] = formatPrimitiveValue(keyColumn.values[row]);
    const numerator = numeratorColumn.values[row];
    const denominator = denominatorColumn.values[row];
    numerators[i] = numerator == null ? undefined : Number(numerator);
    denominators[i] = denominator == null ? undefined : Number(denominator);
  }
  const validation = validateInputData(keys, numerators, denominators, inputSettings.funnel.chart_type);
  if (validation.status !== 0) return { status: "invalid", error: validation.error };

  const keyRows: dataObject["keys"] = [];
  const id: number[] = [];
  const validNumerators: number[] = [];
  const validDenominators: number[] = [];
  const kept: number[] = [];
  for (let i = 0; i < keys.length; i++) {
    if (validation.messages[i] !== "") continue;
    const row = rows[i];
    const key = keys[i];
    const numerator = numerators[i];
    const denominator = denominators[i];
    if (key === undefined || numerator === undefined || denominator === undefined) {
      throw new Error("Validated row contains a missing required value.");
    }
    keyRows.push({ x: id.length, id: row, label: key });
    id.push(row);
    validNumerators.push(numerator);
    validDenominators.push(denominator);
    kept.push(i);
  }
  const annotations = readRowAnnotations({
    categorical: inputView, values: valueRoles, categories,
    cards: { scatter: settingsModel.scatter, labels: settingsModel.labels },
    defaults: { scatter: defaultSettings.scatter, labels: defaultSettings.labels }
  }, rows, kept);
  const warnings = rowWarnings(categories.source.displayName, rows, keys, validation.messages,
    { messages: inputSettingsClass.validationStatus.messages, messagePositionByRowIndex: inputSettingsClass.messagePositionByRowIndex });
  return { status: "valid", data: {
    ...annotations, keys: keyRows, id, numerators: validNumerators, denominators: validDenominators, categories,
    warningMessage: warnings.join("\n"), validationStatus: validation
  } };
}
