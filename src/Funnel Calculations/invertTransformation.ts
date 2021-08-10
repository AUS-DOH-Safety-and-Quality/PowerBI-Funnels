
function invertTransformation(setting_name: string): (x: number) => number {
  if(setting_name == "none") {
      return function(x: number): number { return x; };
  } else if (setting_name == "ln") {
      return function(x: number): number { return Math.exp(x) - 1; };
  } else if (setting_name == "log10") {
    return function(x: number): number { return Math.pow(x, 10) - 1; };
  } else if (setting_name == "sqrt") {
    return function(x: number): number { return Math.pow(x, 2); };
  }
}

export default invertTransformation;