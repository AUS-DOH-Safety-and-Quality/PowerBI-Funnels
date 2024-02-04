import rep from "./rep";
import { validationErrorClass } from "../Classes";

export type ValidationT = { status: number, messages: string[], error?: string };

export default function validateInputData(keys: string[], numerators: number[], denominators: number[], data_type: string): ValidationT {
  const validationRtn: ValidationT = { status: 0, messages: rep("", keys.length) };

  keys.forEach((d, idx) => {
    validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                  ? ((d != null) ? "" : "Date missing")
                                  : validationRtn.messages[idx]});
  if (!validationRtn.messages.some(d => d == "")) {
    validationRtn.status = 1;
    validationRtn.error = "All Groups/IDs are missing or null!";
    return validationRtn;
  }

  numerators.forEach((d, idx) => {
    validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                  ? ((d != null) ? "" : "Numerator missing")
                                  : validationRtn.messages[idx]});
  if (!validationRtn.messages.some(d => d == "")) {
    validationRtn.status = 1;
    validationRtn.error = "All numerators are missing or null!";
    return validationRtn;
  }
  numerators.forEach((d, idx) => {
    validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                  ? ((d >= 0) ? "" : "Numerator negative")
                                  : validationRtn.messages[idx]});
  if (!validationRtn.messages.some(d => d == "")) {
    validationRtn.status = 1;
    validationRtn.error = "All numerators are negative!";
    return validationRtn;
  }

  denominators.forEach((d, idx) => {
    validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                  ? ((d != null) ? "" : "Denominator missing")
                                  : validationRtn.messages[idx]});
  if (!validationRtn.messages.some(d => d == "")) {
    validationRtn.status = 1;
    validationRtn.error = "All denominators missing or null!";
    return validationRtn;
  }
  denominators.forEach((d, idx) => {
    validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                  ? ((d >= 0) ? "" : "Denominator negative")
                                  : validationRtn.messages[idx]});
  if (!validationRtn.messages.some(d => d == "")) {
    validationRtn.status = 1;
    validationRtn.error = "All denominators are negative!";
    return validationRtn;
  }
  if (data_type === "PR") {
    denominators.forEach((d, idx) => {
      validationRtn.messages[idx] = validationRtn.messages[idx] === ""
                                    ? ((d >= numerators[idx]) ? "" : "Denominator < numerator")
                                    : validationRtn.messages[idx]});
    if (!validationRtn.messages.some(d => d == "")) {
      validationRtn.status = 1;
      validationRtn.error = "All denominators are smaller than numerators!";
      return validationRtn;
    }
  }
  return validationRtn;
}
