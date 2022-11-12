function extractValues<T>(valuesArray: T[], indexArray: number[]): T[] {
  return valuesArray.filter((d,idx) => indexArray.indexOf(idx) != -1)
}

export default extractValues;
