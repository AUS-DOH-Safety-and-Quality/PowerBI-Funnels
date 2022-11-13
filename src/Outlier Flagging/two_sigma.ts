import limitData from "../Classes/limitData"
import between from "../Functions/between"

function two_sigma(value: number, flag_direction: string,
                   limits: limitData): boolean {
  if (limits.ul95 === null && limits.ll95 === null) {
    return false;
  } else if (limits.ul95 === null) {
    flag_direction = "lower"
  } else if (limits.ll95 === null) {
    flag_direction = "upper"
  }

  if (!between(value, limits.ll95, limits.ul95)) {
    if (flag_direction === "both") {
      return true;
    } else if (flag_direction === "upper") {
      return value > limits.ul95;
    } else if (flag_direction === "lower") {
      return value < limits.ll95;
    }
  }
  return false;
}

export default two_sigma;
