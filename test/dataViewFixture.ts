import type powerbi from "powerbi-visuals-api";

export function categoricalData(
  numerators: powerbi.PrimitiveValue[] = [4, 16, 25],
  denominators: powerbi.PrimitiveValue[] = [10, 90, 100],
  keys: powerbi.PrimitiveValue[] = ["A", "B", "C"]
): powerbi.DataViewCategorical {
  const values: powerbi.DataViewValueColumns = Object.assign([
    { source: { displayName: "Numerator", roles: { numerators: true } }, values: numerators },
    { source: { displayName: "Denominator", roles: { denominators: true } }, values: denominators }
  ], { grouped: () => [] });
  return { categories: [{ source: { displayName: "Group", roles: { key: true } }, values: keys }], values };
}

export function dataView(categorical = categoricalData()): powerbi.DataView {
  return { metadata: { columns: [] }, categorical };
}
