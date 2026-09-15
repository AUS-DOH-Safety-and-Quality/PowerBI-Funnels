import type powerbi from "powerbi-visuals-api";

export default function validateDataView(inputDV: powerbi.DataView[]): string {
  if (!(inputDV?.[0])) {
    return "No data present";
  }
  const categories = inputDV[0]?.categorical?.categories;
  const key = categories?.find(d => d.source?.roles?.key);
  if (!key) {
    return "No grouping/ID variable passed!";
  }
  if (!key.values?.length) {
    return "No data present";
  }

  const numeratorsPresent: boolean
    = inputDV[0].categorical
                   ?.values
                   ?.some(d => d.source?.roles?.numerators) ?? false;

  if (!numeratorsPresent) {
    return "No Numerators passed!";
  }
  const denominatorsPresent: boolean
    = inputDV[0].categorical
                    ?.values
                    ?.some(d => d.source?.roles?.denominators) ?? false;

  if (!denominatorsPresent) {
    return "No denominators passed!";
  }

  return "valid";
}
