import type powerbi from "powerbi-visuals-api";
import { validateDataView, type PrimitiveValue, type ValidatedDataView } from "powerbi-visuals-core/powerbi";
import { cells } from "powerbi-visuals-core/testing";

/** The fixture always has category and value columns */
export type FixtureCategorical = powerbi.DataViewCategorical & {
  categories: powerbi.DataViewCategoryColumn[];
  values: powerbi.DataViewValueColumns;
};

export function categoricalData(
  numerators: PrimitiveValue[] = [4, 16, 25],
  denominators: PrimitiveValue[] = [10, 90, 100],
  keys: PrimitiveValue[] = ["A", "B", "C"]
): FixtureCategorical {
  const columns: powerbi.DataViewValueColumn[] = [
    { source: { displayName: "Numerator", roles: { numerators: true } }, values: cells(numerators) },
    { source: { displayName: "Denominator", roles: { denominators: true } }, values: cells(denominators) }
  ];
  const values: powerbi.DataViewValueColumns = Object.assign(columns, { grouped: () => [] });
  return { categories: [{ source: { displayName: "Group", roles: { key: true } }, values: cells(keys) }], values };
}

export function dataView(categorical = categoricalData()): powerbi.DataView {
  return { metadata: { columns: [] }, categorical };
}

export function validated(categorical = categoricalData()): ValidatedDataView<"numerators" | "denominators"> {
  const result = validateDataView([dataView(categorical)], ["numerators", "denominators"]);
  if (result.status !== "valid") {
    throw new Error(result.error);
  }
  return result.view;
}
