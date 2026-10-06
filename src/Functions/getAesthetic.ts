import type { settingsValueType } from "../settings"

const lineNameMap = {
  "ll99" : "99",
  "ll95" : "95",
  "ll68" : "68",
  "ul68" : "68",
  "ul95" : "95",
  "ul99" : "99",
  "target" : "target",
  "alt_target" : "alt_target"
} as const;

export type LineName = keyof typeof lineNameMap;
type LineAesthetic = "colour" | "width" | "type" | "opacity" | "opacity_unselected";

export default function getAesthetic(type: LineName, group: "lines", aesthetic: LineAesthetic, inputSettings: settingsValueType): string | number {
  const settingName = `${aesthetic}_${lineNameMap[type]}` as const;
  return inputSettings[group][settingName];
}

export { lineNameMap }
