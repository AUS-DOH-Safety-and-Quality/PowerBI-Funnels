import powerbi from "powerbi-visuals-api";

function checkInvalidDataView(inputDV: powerbi.DataView[]): boolean {
  return !inputDV
    || !inputDV[0]
    || !inputDV[0].categorical
    || !inputDV[0].categorical.categories
    || !inputDV[0].categorical.categories[0].source
    || !inputDV[0].categorical.values
    || !inputDV[0].metadata
    || !inputDV[0].categorical.values[0].source.roles.numerator
    || !inputDV[0].categorical.values[1].source.roles.denominator
    || inputDV[0].categorical.values.some(d => d.values.length < 1)
    || inputDV[0].categorical.categories.some(d => d.values.length < 1);
}

export default checkInvalidDataView;
