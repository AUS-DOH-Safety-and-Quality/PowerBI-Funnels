import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import validateInputData from "./validateInputData";
import type { settingsClass } from "../Classes";
import settingsModel, { defaultSettings, type settingsValueType } from "../settings";
import { formatPrimitiveValue, indexColumnsByRole, readSettingsRows } from "powerbi-visuals-core/powerbi";
import type { ValidationT } from "./validateInputData";

export type dataObject = {
  keys: { x: number; id: number; label: string }[];
  id: number[];
  numerators: number[];
  denominators: number[];
  highlights: (Exclude<powerbi.PrimitiveValue, null> | undefined)[] | undefined;
  anyHighlights: boolean;
  categories: powerbi.DataViewCategoryColumn;
  scatter_formatting: settingsValueType["scatter"][];
  label_formatting: settingsValueType["labels"][];
  tooltips: VisualTooltipDataItem[][] | undefined;
  labels: (string | undefined)[] | undefined;
  anyLabels: boolean;
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

  const labels = valueRoles.labels?.[0];
  const tooltips = valueRoles.tooltips;
  const highlights = inputView.values?.[0]?.highlights;
  const scatter = readSettingsRows(settingsModel.scatter, "scatter", defaultSettings.scatter, categories, rows).values;
  const labelSettings = readSettingsRows(settingsModel.labels, "labels", defaultSettings.labels, categories, rows).values;
  const result: dataObject = {
    keys: [], id: [], numerators: [], denominators: [], categories,
    scatter_formatting: [], label_formatting: [],
    tooltips: tooltips === undefined ? undefined : [],
    labels: labels === undefined ? undefined : [],
    highlights: highlights === undefined ? undefined : [],
    anyHighlights: false, anyLabels: false, warningMessage: "", validationStatus: validation
  };
  const removalMessages: string[] = [];
  const groupName = categories.source.displayName;
  for (let i = 0; i < keys.length; i++) {
    const row = rows[i];
    const key = keys[i];
    const numerator = numerators[i];
    const denominator = denominators[i];
    if (validation.messages[i] !== "") {
      removalMessages.push(`${groupName} ${key} removed due to: ${validation.messages[i]}.`);
      continue;
    }
    if (key === undefined || numerator === undefined || denominator === undefined) {
      throw new Error("Validated row contains a missing required value.");
    }
    result.keys.push({ x: result.id.length, id: row, label: key });
    result.id.push(row);
    result.numerators.push(numerator);
    result.denominators.push(denominator);
    result.scatter_formatting.push(scatter[i]);
    result.label_formatting.push(labelSettings[i]);
    const label = formatPrimitiveValue(labels?.values[row]);
    result.labels?.push(label);
    result.anyLabels ||= label !== undefined && label !== "";
    if (tooltips !== undefined) {
      const rowTooltips: VisualTooltipDataItem[] = [];
      for (let j = 0; j < tooltips.length; j++) {
        rowTooltips.push({ displayName: tooltips[j].source.displayName, value: formatPrimitiveValue(tooltips[j].values[row]) ?? "" });
      }
      result.tooltips?.push(rowTooltips);
    }
    const highlight = highlights?.[row] ?? undefined;
    result.highlights?.push(highlight);
    result.anyHighlights ||= highlight !== undefined;
    const position = inputSettingsClass.messagePositionByRowIndex.get(row);
    const messages = position === undefined ? undefined : inputSettingsClass.validationStatus.messages[position];
    if (messages !== undefined) {
      for (let j = 0; j < messages.length; j++) {
        removalMessages.push(`Conditional formatting for ${groupName} ${key} ignored due to: ${messages[j]}.`);
      }
    }
  }
  result.warningMessage = removalMessages.join("\n");
  return { status: "valid", data: result };
}
