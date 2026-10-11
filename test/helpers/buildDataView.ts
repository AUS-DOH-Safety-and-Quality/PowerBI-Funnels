import type powerbi from "powerbi-visuals-api";
import type { PrimitiveValue, ValidatedDataView } from "powerbi-visuals-core/powerbi";
import {
  buildDataView as build, validatedView as validate, type DataViewColumnInput, type SettingsOverrides as Overrides
} from "powerbi-visuals-core/testing";
import type { settingsValueType } from "../../src/settings";

export type SettingsOverrides = Overrides<settingsValueType>;
export type Settings = SettingsOverrides | SettingsOverrides[];
export type Inputs = Partial<Record<"key" | "numerators" | "denominators" | "labels" | "tooltips", PrimitiveValue[]>> & {
  /** Further columns by role, such as indicators or named tooltip columns */
  columns?: DataViewColumnInput[];
};

const roles = ["key", "numerators", "denominators", "labels", "tooltips"] as const;

/** The groups most tests start from */
export const sample: Inputs = { key: ["A", "B", "C"], numerators: [4, 16, 25], denominators: [10, 90, 100] };

/** Columns named by role, the key as "Group"; the key and indicators are categories */
export default function buildDataView(inputs: Inputs, settings: Settings = {}): powerbi.DataView {
  const categories: DataViewColumnInput[] = [];
  const values: DataViewColumnInput[] = [];
  for (let r = 0; r < roles.length; r++) {
    const role = roles[r];
    const input = inputs[role];
    if (input === undefined) {
      continue;
    }
    if (role === "key") {
      categories.push({ role, values: input, displayName: "Group" });
    } else {
      values.push({ role, values: input });
    }
  }
  const columns = inputs.columns ?? [];
  for (let i = 0; i < columns.length; i++) {
    (columns[i].role === "indicator" ? categories : values).push(columns[i]);
  }
  return build({ categories, values }, settings);
}

/** The view Core validates for the funnel's required roles */
export function validatedView(inputs: Inputs, settings?: Settings): ValidatedDataView<"numerators" | "denominators"> {
  return validate(buildDataView(inputs, settings), ["numerators", "denominators"]);
}
