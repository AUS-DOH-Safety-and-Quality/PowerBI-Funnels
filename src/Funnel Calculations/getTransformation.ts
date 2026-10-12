import type { settingsValueType } from "../settings";

const transformations: Readonly<Record<settingsValueType["funnel"]["transformation"], (x: number) => number>> = {
  none: function(x: number): number { return x; },
  ln: function(x: number): number { return Math.log(x + 1); },
  log10: function(x: number): number { return Math.log10(x + 1); },
  sqrt: Math.sqrt
};

export default function getTransformation(setting_name: settingsValueType["funnel"]["transformation"]): (x: number) => number {
  return transformations[setting_name];
}
