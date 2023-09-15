import rep from "./rep";

export default function validateInputData(keys: string[], numerators: number[], denominators: number[], data_type: string): string[] {
  const status: string[] = rep("", keys.length);
  keys.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Date missing");
  if (!status.some(d => d == "")) {
    throw("All dates/IDs are missing or null!")
  }

  numerators.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Numerator missing");
  if (!status.some(d => d == "")) {
    throw("All numerators are missing or null!")
  }

  numerators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= 0) ? "" : "Numerator negative");
  if (!status.some(d => d == "")) {
    throw("All numerators are negative!")
  }

  denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Denominator missing");
  if (!status.some(d => d == "")) {
    throw("All denominators missing or null!")
  }
  denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= 0) ? "" : "Denominator negative");
  if (!status.some(d => d == "")) {
    throw("All denominators are negative!")
  }
  if (data_type === "PR") {
    denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= numerators[idx]) ? "" : "Denominator < numerator");
    if (!status.some(d => d == "")) {
      throw("All denominators are smaller than numerators!")
    }
  }
  return status;
}
