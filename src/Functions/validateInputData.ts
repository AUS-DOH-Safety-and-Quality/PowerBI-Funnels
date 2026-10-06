export type ValidationT =
  | { status: 0; messages: string[] }
  | { status: 1; messages: string[]; error: string };

const rowMessages = ["", "Group missing", "Numerator missing", "Numerator is not a number", "Numerator negative",
  "Denominator missing", "Denominator is not a number", "Denominator is not finite", "Denominator negative",
  "Denominator is zero", "Denominator < numerator"];
const errors = ["", "All Groups/IDs are missing or null!", "All numerators are missing or null!",
  "All numerators are not numbers!", "All numerators are negative!", "All denominators missing or null!",
  "All denominators are not numbers!", "All denominators are not finite!", "All denominators are negative!",
  "All denominators are zero!", "All denominators are smaller than numerators!"];

export default function validateInputData(keys: readonly (string | undefined)[], numerators: readonly (number | undefined)[],
  denominators: readonly (number | undefined)[], data_type: string): ValidationT {
  const messages = new Array<string>(keys.length);
  let anyValid = false;
  let sameStage = keys.length > 0;
  let firstStage = 0;
  for (let i = 0; i < keys.length; i++) {
    const numerator = numerators[i];
    const denominator = denominators[i];
    let stage = 0;
    if (keys[i] === undefined) stage = 1;
    else if (numerator === undefined) stage = 2;
    else if (isNaN(numerator)) stage = 3;
    else if (numerator < 0) stage = 4;
    else if (denominator === undefined) stage = 5;
    else if (isNaN(denominator)) stage = 6;
    else if (!Number.isFinite(denominator)) stage = 7;
    else if (denominator < 0) stage = 8;
    else if (denominator === 0) stage = 9;
    else if (data_type === "PR" && !(denominator >= numerator)) stage = 10;
    messages[i] = rowMessages[stage];
    if (stage === 0) anyValid = true;
    if (i === 0) firstStage = stage;
    else if (stage !== firstStage) sameStage = false;
  }
  if (anyValid) return { status: 0, messages };
  // A single shared failure names it; mixed failures get the generic error.
  return { status: 1, messages, error: sameStage ? errors[firstStage] : "No valid data found!" };
}
