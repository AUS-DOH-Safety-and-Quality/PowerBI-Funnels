export default function between<T>(x: T, lower: T, upper: T): boolean {
  let is_between: boolean = true;
  if (lower !== null && lower !== undefined) {
    is_between = is_between && (x >= lower);
  }
  if (upper !== null && upper !== undefined) {
    is_between = is_between && (x <= upper);
  }
  return is_between;
}
