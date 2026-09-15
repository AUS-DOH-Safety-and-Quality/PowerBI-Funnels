export default function getTransformation(setting_name: string): (x: number) => number {
  switch(setting_name) {
    case "none":
      return function(x: number): number { return x; };
    case "ln":
      return function(x: number): number { return Math.log(x+1); };
    case "log10":
      return function(x: number): number { return Math.log10(x+1); };
    case "sqrt":
      return Math.sqrt
    default:
      return function(x: number): number { return x; };
  }
}
