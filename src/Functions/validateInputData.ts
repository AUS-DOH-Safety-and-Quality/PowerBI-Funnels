import rep from "./rep";
import { validationErrorClass } from "../Classes";

export default function validateInputData(keys: string[], numerators: number[], denominators: number[], data_type: string): string[] {
  const status: string[] = rep("", keys.length);
  keys.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Group missing");
  if (!status.some(d => d == "")) {
    throw(new validationErrorClass("All Groups/IDs are missing or null!"))
  }

  numerators.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Numerator missing");
  if (!status.some(d => d == "")) {
    throw(new validationErrorClass("All numerators are missing or null!"))
  }

  numerators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= 0) ? "" : "Numerator negative");
  if (!status.some(d => d == "")) {
    throw(new validationErrorClass("All numerators are negative!"))
  }

  denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d != null) ? "" : "Denominator missing");
  if (!status.some(d => d == "")) {
    throw(new validationErrorClass("All denominators missing or null!"))
  }
  denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= 0) ? "" : "Denominator negative");
  if (!status.some(d => d == "")) {
    throw(new validationErrorClass("All denominators are negative!"))
  }
  if (data_type === "PR") {
    denominators.forEach((d, idx) => status[idx] = (status[idx] === "" && d >= numerators[idx]) ? "" : "Denominator < numerator");
    if (!status.some(d => d == "")) {
      throw(new validationErrorClass("All denominators are smaller than numerators!"))
    }
  }
  return status;
}
