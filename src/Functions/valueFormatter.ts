import type { defaultSettingsType, derivedSettingsClass } from "../Classes";
import isNullOrUndefined from "./isNullOrUndefined";

const formatValues = function<T>(value: T, name: string,
                                        inputSettings: defaultSettingsType,
                                        derivedSettings: derivedSettingsClass): string {
  const suffix: string = derivedSettings.percentLabels ? "%" : "";
  const sig_figs: number = inputSettings.funnel.sig_figs;
  if (isNullOrUndefined(value)) {
    return "";
  }
  switch (name) {
    case "date":
      return value as string;
    case "integer": {
      return (value as number).toFixed(0);
    }
    default:
      return (value as number).toFixed(sig_figs) + suffix;
  }
}

export default function valueFormatter(inputSettings: defaultSettingsType, derivedSettings: derivedSettingsClass) {
  const formatValuesImpl = function<T>(value: T, name: string): string {
    return formatValues(value, name, inputSettings, derivedSettings);
  }
  return formatValuesImpl;
}
