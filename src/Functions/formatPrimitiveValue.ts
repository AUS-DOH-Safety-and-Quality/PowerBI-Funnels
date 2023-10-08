import type powerbi from "powerbi-visuals-api"
import broadcastBinary from "./BinaryFunctions"
type PrimitiveValue = powerbi.PrimitiveValue
type ValueTypeDescriptor = powerbi.ValueTypeDescriptor

const formatPrimitiveValue = broadcastBinary((rawValue: PrimitiveValue,
                                              valueType: ValueTypeDescriptor): string => {
  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  if (valueType.numeric) {
    return (<number>rawValue).toString()
  } else {
    return <string>rawValue
  }
})

export default formatPrimitiveValue;
