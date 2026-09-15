import type powerbi from "powerbi-visuals-api"
import isNullOrUndefined from "./isNullOrUndefined"
type PrimitiveValue = powerbi.PrimitiveValue
type ValueTypeDescriptor = powerbi.ValueTypeDescriptor


export default function formatPrimitiveValue(rawValue: PrimitiveValue,
                                              valueType: ValueTypeDescriptor): string {
  if (isNullOrUndefined(rawValue)) {
    return "";
  }

  if (valueType.numeric) {
    return (<number>rawValue).toString()
  } else {
    return <string>rawValue
  }
}
