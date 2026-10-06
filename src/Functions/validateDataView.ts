import type powerbi from "powerbi-visuals-api";

export default function validateDataView(inputDV: powerbi.DataView[] | undefined): string {
  const view = inputDV?.[0];
  if (view === undefined) return "No data present";
  const categorical = view.categorical;
  if (categorical?.categories?.[0] === undefined) return "No grouping/ID variable passed!";
  let numeratorsPresent = false;
  let denominatorsPresent = false;
  let keyColumn: powerbi.DataViewCategoryColumn | undefined;
  for (let i = 0; i < categorical.categories.length; i++) {
    if (keyColumn === undefined && categorical.categories[i].source.roles?.key === true) keyColumn = categorical.categories[i];
  }
  if (keyColumn === undefined) return "No grouping/ID variable passed!";
  if (keyColumn.values.length === 0) return "No data present";
  const values = categorical.values;
  if (values !== undefined) {
    for (let i = 0; i < values.length; i++) {
      numeratorsPresent ||= values[i].source.roles?.numerators === true;
      denominatorsPresent ||= values[i].source.roles?.denominators === true;
    }
  }
  if (!numeratorsPresent) return "No Numerators passed!";
  if (!denominatorsPresent) return "No denominators passed!";
  return "valid";
}
