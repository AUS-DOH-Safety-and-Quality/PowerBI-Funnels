import type powerbi from "powerbi-visuals-api";
import type { PrimitiveValue } from "powerbi-visuals-core/powerbi";
import { buildDataView as build, type DataViewColumnInput, type SettingsOverrides as Overrides } from "powerbi-visuals-core/testing";
import type { settingsValueType } from "../../src/settings";

export type SettingsOverrides = Overrides<settingsValueType>;
export type Inputs = Partial<Record<"key" | "numerators" | "denominators" | "labels" | "tooltips", PrimitiveValue[]>>;

/** Columns named by role; the key is the category */
export default function buildDataView(inputs: Inputs, settings: SettingsOverrides | SettingsOverrides[] = {}): powerbi.DataView {
  const categories: DataViewColumnInput[] = [];
  const values: DataViewColumnInput[] = [];
  const roles = Object.keys(inputs) as (keyof Inputs)[];
  for (let r = 0; r < roles.length; r++) {
    const role = roles[r];
    const input = inputs[role];
    if (input === undefined) {
      continue;
    }
    (role === "key" ? categories : values).push({ role, values: input });
  }
  return build({ categories, values }, settings);
}
