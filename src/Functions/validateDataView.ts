import type powerbi from "powerbi-visuals-api";

export default function validateDataView(inputDV: powerbi.DataView[]): string {
  if (!(inputDV?.[0])) {
    return "No data present";
  }
  if (!(inputDV[0]?.categorical?.categories)) {
    return "No grouping/ID variable passed!";
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
