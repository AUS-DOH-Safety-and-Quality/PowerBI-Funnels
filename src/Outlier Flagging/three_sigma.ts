import type { limitData } from "../Classes/chartObject";
import { between } from "../Functions"

export default function three_sigma(value: number, flag_direction: string,
                   limits: limitData): boolean {
  if (limits.ul99 === null && limits.ll99 === null) {
    return false;
  } else if (limits.ul99 === null) {
    flag_direction = "lower"
  } else if (limits.ll99 === null) {
    flag_direction = "upper"
  }

  if (!between(value, limits.ll99, limits.ul99)) {
    if (flag_direction === "both") {
      return true;
    } else if (flag_direction == "upper") {
      return value > limits.ul99;
    } else if (flag_direction == "lower") {
      return value < limits.ll99;
    }
  }
  return false;
}
