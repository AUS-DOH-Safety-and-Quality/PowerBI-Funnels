export default function winsorise<T extends number | number[]>(val: T, limits: {lower?: number, upper?: number}): T {
  let rtn: T = val;
  if (limits.lower) {
    if (Array.isArray(rtn)) {
      rtn = rtn.map(d => d < limits.lower ? limits.lower : d) as T;
    } else if (typeof rtn === "number") {
      rtn = (rtn as T) < (limits.lower as T) ? (limits.lower as T) : rtn as T;
    }
  }
  if (limits.upper) {
    if (Array.isArray(rtn)) {
      rtn = rtn.map(d => d > limits.upper ? limits.upper : d) as T;
    } else if (typeof rtn === "number") {
      rtn = (rtn as T) > (limits.upper as T) ? (limits.upper as T) : rtn as T;
    }
  }
  return rtn;
}
