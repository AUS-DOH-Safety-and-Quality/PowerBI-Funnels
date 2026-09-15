export type ValidationT = { status: number, messages: string[], error?: string };

const allInvalidErrors: Record<string, string> = {
  "Group missing": "All Groups/IDs are missing or null!",
  "Numerator missing": "All numerators are missing or null!",
  "Numerator is not a number": "All numerators are not numbers!",
  "Numerator negative": "All numerators are negative!",
  "Denominator missing": "All denominators missing or null!",
  "Denominator is not a number": "All denominators are not numbers!",
  "Denominator negative": "All denominators are negative!",
  "Denominator zero": "All denominators are zero!",
  "Denominator < numerator": "All denominators are smaller than numerators!"
};

function validateRow(key: string | undefined, numerator: number | undefined,
                      denominator: number | undefined, data_type: string): string {
  if (key == null) return "Group missing";
  if (numerator == null) return "Numerator missing";
  if (!Number.isFinite(numerator)) return "Numerator is not a number";
  if (numerator < 0) return "Numerator negative";
  if (denominator == null) return "Denominator missing";
  if (!Number.isFinite(denominator)) return "Denominator is not a number";
  if (denominator < 0) return "Denominator negative";
  if (denominator === 0) return "Denominator zero";
  if (data_type === "PR" && denominator < numerator) return "Denominator < numerator";
  return "";
}

export default function validateInputData(keys: string[], numerators: number[], denominators: number[], data_type: string): ValidationT {
  const n: number = keys.length;
  const messages: string[] = new Array<string>(n);
  let anyValid = false;
  let sameError = n > 0;
  for (let i = 0; i < n; i++) {
    const message = validateRow(keys[i], numerators[i], denominators[i], data_type);
    messages[i] = message;
    anyValid = anyValid || message === "";
    sameError = sameError && message === messages[0];
  }
  if (anyValid) {
    return { status: 0, messages };
  }
  return {
    status: 1,
    messages,
    error: sameError ? allInvalidErrors[messages[0]] : "No valid data found!"
  };
}
