import type powerbi from "powerbi-visuals-api";
import type { settingsValueType } from "../../src/settings";

export type SettingsOverrides = { [K in keyof settingsValueType]?: Partial<settingsValueType[K]> };
type Inputs = Partial<Record<"key" | "numerators" | "denominators" | "labels" | "tooltips", powerbi.PrimitiveValue[]>>;

export default function buildDataView(inputs: Inputs, settings: SettingsOverrides | SettingsOverrides[] = {}): powerbi.DataView {
  const columns: powerbi.DataViewMetadataColumn[] = [];
  const categories: powerbi.DataViewCategoryColumn[] = [];
  const values: powerbi.DataViewValueColumns = Object.assign([], { grouped: () => [] });

  const perRowSettings = Array.isArray(settings);
  for (const role in inputs) {
    const input = inputs[role as keyof Inputs]!;
    const objects = role === "key" ? new Array<powerbi.DataViewObjects>(input.length) : undefined;
    let firstValue: powerbi.PrimitiveValue | undefined;
    for (let i = 0; i < input.length; i++) {
      if (firstValue == null) firstValue = input[i];
      if (objects) objects[i] = (perRowSettings ? settings[i] : settings) as powerbi.DataViewObjects;
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
        values: input,
        objects
      });
    } else {
      values.push({ source, values: input });
    }
  }
  return { metadata: { columns }, categorical: { categories, values } };
}
