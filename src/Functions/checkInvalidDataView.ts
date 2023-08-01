import type powerbi from "powerbi-visuals-api";

export default function checkInvalidDataView(inputDV: powerbi.DataView[]): boolean {
  const flag1: boolean = !inputDV
    || !inputDV[0]
    || !inputDV[0].categorical
    || !inputDV[0].categorical.categories
    || !inputDV[0].categorical.values
    || !inputDV[0].metadata;

  if (flag1) {
    return flag1;
  }

  const flag2: boolean =
    !inputDV[0].categorical.categories[0].source
    || inputDV[0].categorical.values.length < 2

  if (flag2) {
    return flag2;
  }
  const flag3: boolean =
    !inputDV[0].categorical.values[0].source.roles.numerators
    || !inputDV[0].categorical.values[1].source.roles.denominators

  if (flag3) {
    return flag3;
  }

  const flag4: boolean =
    inputDV[0].categorical.values.some(d => d.values.length < 1)
    || inputDV[0].categorical.categories.some(d => d.values.length < 1);
  return flag4;
}

