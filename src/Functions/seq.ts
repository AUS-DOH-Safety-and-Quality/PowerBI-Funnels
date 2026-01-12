/**
 * Generates a sequence of numbers from 'from' to 'to' with a step of 'by'.
 *
 * @param from The starting number of the sequence.
 * @param to The ending number of the sequence.
 * @param by The step increment between each number in the sequence.
 * @returns An array containing the generated sequence of numbers.
 */
export default function seq(from: number, to: number, by: number): number[] {
  const n_iter: number = Math.floor((to - from) / by);
  const res: number[] = new Array<number>(n_iter);
  res[0] = from;
  for (let i: number = 1; i < n_iter; i++) {
    res[i] = res[i-1] + by;
  }
  return res;
}
