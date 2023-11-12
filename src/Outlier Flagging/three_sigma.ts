import type { limitData } from "../Classes";

export default function three_sigma(value: number,
                                    limits: limitData): string {
  if ((limits.ll99 !== null) && (value < limits.ll99)) {
    return "lower";
  } else if ((limits.ul99 !== null) && (value > limits.ul99)) {
    return "upper";
  } else {
    return "none";
  }
}
