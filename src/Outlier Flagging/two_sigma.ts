import type { limitData } from "../Classes";

export default function two_sigma(value: number,
                   limits: limitData): string {
  if ((limits.ll95 !== null) && (value < limits.ll95)) {
    return "lower";
  } else if ((limits.ul95 !== null) && (value > limits.ul95)) {
    return "upper";
  } else {
    return "none";
  }
}
