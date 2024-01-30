import type powerbi from "powerbi-visuals-api";
import { validationErrorClass } from "../Classes";

export default function validateDataView(inputDV: powerbi.DataView[]) {
  if (!(inputDV?.[0])) {
    throw(new validationErrorClass("No data present"));
  }
  if (!(inputDV[0]?.categorical?.categories?.[0]?.values?.length > 0)) {
    throw(new validationErrorClass("No grouping/ID variable passed!"));
  }

  const numeratorsPresent: boolean
    = inputDV[0].categorical
                   ?.values
                   ?.some(d => d.source?.roles?.numerators);

  if (!numeratorsPresent) {
    throw(new validationErrorClass("No Numerators passed!"));
  }
  const denominatorsPresent: boolean
    = inputDV[0].categorical
                    ?.values
                    ?.some(d => d.source?.roles?.denominators);

  if (!denominatorsPresent) {
    throw(new validationErrorClass("No denominators passed!"));
  }
}
