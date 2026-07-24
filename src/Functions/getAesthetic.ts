import type { settingsValueType, SettingsValueKeys, SettingsValueNestedKeys } from "../settings";
import getNested from "./getNested";

const lineNameMap: Record<string, string> = {
  "ll99" : "99",
  "ll95" : "95",
  "ll68" : "68",
  "ul68" : "68",
  "ul95" : "95",
  "ul99" : "99",
  "target" : "target",
  "alt_target" : "alt_target"
}

export default function getAesthetic(type: string, group: string, aesthetic: string, inputSettings: settingsValueType): string | number {
  const mapName: string = group.includes("line") ? lineNameMap[type] : type;
  const settingName: string = aesthetic + "_" + mapName;
  return getNested(inputSettings, group as SettingsValueKeys, settingName as SettingsValueNestedKeys) as string | number;
}

export { lineNameMap }
