import type { settingsValueType } from "../settings";
import type derivedSettingsClass from "../Classes/derivedSettingsClass";
import { formatNumber } from "powerbi-visuals-core/data";

export default function valueFormatter(settings: settingsValueType, derivedSettings: derivedSettingsClass) {
  const decimalPlaces = settings.funnel.sig_figs;
  const integerPlaces = 0;
  const suffix = derivedSettings.percentLabels ? "%" : "";
  return (value: number | undefined, name: "integer" | "value"): string =>
    formatNumber(value, name === "integer" ? integerPlaces : decimalPlaces, name === "integer" ? "" : suffix) ?? "";
}
