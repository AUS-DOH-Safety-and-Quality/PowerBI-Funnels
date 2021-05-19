
function getTransformation(setting_name: string): (x: number) => number {
  if(setting_name == "none") {
      return function(x: number): number { return x; };
  } else if (setting_name == "ln") {
      return function(x: number): number { return Math.log(x+1); };
  } else if (setting_name == "log10") {
    return function(x: number): number { return Math.log10(x+1); };
  } else if (setting_name == "sqrt") {
      return Math.sqrt;
  }
}

export default getTransformation;