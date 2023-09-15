import type powerbi from "powerbi-visuals-api";

export default function validateDataView(inputDV: powerbi.DataView[]) {
  if (!(inputDV?.at(0))) {
    throw("No data present");
  }
  if (!(inputDV.at(0)?.categorical?.categories?.at(0)?.values?.length > 0)) {
    throw("Error: No grouping/ID variable passed!");
  }

  const numeratorsPresent: boolean
    = inputDV.at(0).categorical
                   ?.values
                   ?.some(d => d.source?.roles?.numerators);

  if (!numeratorsPresent) {
    throw("Error: No Numerators passed!");
  }
  const denominatorsPresent: boolean
    = inputDV.at(0).categorical
                    ?.values
                    ?.some(d => d.source?.roles?.denominators);

  if (!denominatorsPresent) {
    throw(`Error: No denominators passed!`);
  }
}
