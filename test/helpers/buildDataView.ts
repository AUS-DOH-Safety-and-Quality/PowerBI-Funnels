import type powerbi from "powerbi-visuals-api";
import type { PrimitiveValue } from "powerbi-visuals-core/powerbi";
import { cells } from "powerbi-visuals-core/testing";
import type { settingsValueType } from "../../src/settings";

export type SettingsOverrides = { [K in keyof settingsValueType]?: Partial<settingsValueType[K]> };
type Inputs = Partial<Record<"key" | "numerators" | "denominators" | "labels" | "tooltips", PrimitiveValue[]>>;

export default function buildDataView(inputs: Inputs, settings: SettingsOverrides | SettingsOverrides[] = {}): powerbi.DataView {
  const columns: powerbi.DataViewMetadataColumn[] = [];
  const categories: powerbi.DataViewCategoryColumn[] = [];
  const values: powerbi.DataViewValueColumns = Object.assign([], { grouped: () => [] });

  const perRowSettings = Array.isArray(settings);
  const roles = Object.keys(inputs) as (keyof Inputs)[];
  for (let r = 0; r < roles.length; r++) {
    const role = roles[r];
    const input = inputs[role]!;
    const objects = role === "key" ? new Array<powerbi.DataViewObjects>(input.length) : undefined;
    let firstValue: PrimitiveValue;
    for (let i = 0; i < input.length; i++) {
      if (firstValue == null) {
        firstValue = input[i];
      }
      if (objects) {
        objects[i] = (perRowSettings ? settings[i] : settings) as powerbi.DataViewObjects;
      }
    }
    const source: powerbi.DataViewMetadataColumn = {
      displayName: role,
      queryName: role,
      roles: { [role]: true },
      type: typeof firstValue === "number" ? { numeric: true } : { text: true }
    };
    columns.push(source);
    if (role === "key") {
      categories.push({
        source,
        values: cells(input),
        objects
      });
    } else {
      values.push({ source, values: cells(input) });
    }
  }
  return { metadata: { columns }, categorical: { categories, values } };
}
