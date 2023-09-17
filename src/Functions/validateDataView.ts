import type powerbi from "powerbi-visuals-api";
import { validationErrorClass } from "../Classes";

export default function validateDataView(inputDV: powerbi.DataView[]) {
  if (!(inputDV?.at(0))) {
    throw(new validationErrorClass("No data present"));
  }
  if (!(inputDV.at(0)?.categorical?.categories?.at(0)?.values?.length > 0)) {
    throw(new validationErrorClass("Error: No grouping/ID variable passed!"));
  }

  const numeratorsPresent: boolean
    = inputDV.at(0).categorical
                   ?.values
                   ?.some(d => d.source?.roles?.numerators);

  if (!numeratorsPresent) {
    throw(new validationErrorClass("Error: No Numerators passed!"));
  }
  const denominatorsPresent: boolean
    = inputDV.at(0).categorical
                    ?.values
                    ?.some(d => d.source?.roles?.denominators);

  if (!denominatorsPresent) {
    throw(new validationErrorClass("Error: No denominators passed!"));
  }
}
