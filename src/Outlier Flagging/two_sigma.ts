import type { limitData } from "../Classes";

export default function two_sigma(value: number,
                   limits: limitData): string {
  if (value < limits.ll99) {
    return "lower";
  } else if (value > limits.ul99) {
    return "upper";
  } else {
    return "none";
  }
}
