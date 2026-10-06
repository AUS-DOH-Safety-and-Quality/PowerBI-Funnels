import type { limitData } from "../Classes";

export default function three_sigma(value: number,
                                    limits: limitData): "lower" | "upper" | "none" {
  if ((limits.ll99 !== undefined) && (value < limits.ll99)) {
    return "lower";
  } else if ((limits.ul99 !== undefined) && (value > limits.ul99)) {
    return "upper";
  } else {
    return "none";
  }
}
