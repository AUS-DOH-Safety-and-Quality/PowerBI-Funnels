import type { limitData } from "../Classes";

export default function two_sigma(value: number,
                   limits: limitData): "lower" | "upper" | "none" {
  if ((limits.ll95 !== undefined) && (value < limits.ll95)) {
    return "lower";
  } else if ((limits.ul95 !== undefined) && (value > limits.ul95)) {
    return "upper";
  } else {
    return "none";
  }
}
