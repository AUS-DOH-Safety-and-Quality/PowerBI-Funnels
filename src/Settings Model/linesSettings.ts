import { createLineGroup, numberOption } from "powerbi-visuals-core/settings";

const linesSettings = {
  description: "Line Settings",
  displayName: "Line Settings",
  settingsGroups: {
    "Target": createLineGroup("target", {
      showLabel: "Show Target", showDefault: true,
      width: 1.5, type: "10 0", colour: "standard", rebaselines: false, tooltipLabel: "Centerline"
    }),
    "Alt. Target": createLineGroup("alt_target", {
      showLabel: "Show Alt. Target Line", showDefault: false,
      width: 1.5, type: "10 0", colour: "standard", rebaselines: false, tooltipLabel: "Alt. Target"
    }, { alt_target: numberOption("Additional Target Value:", undefined) }),
    "68% Limits": createLineGroup("68", {
      showLabel: "Show 68% Lines", showDefault: false,
      width: 2, type: "2 5", colour: "limits", rebaselines: false, tooltipLabel: "68% Limit", tooltipPrefixes: true
    }),
    "95% Limits": createLineGroup("95", {
      showLabel: "Show 95% Lines", showDefault: true,
      width: 2, type: "2 5", colour: "limits", rebaselines: false, tooltipLabel: "95% Limit", tooltipPrefixes: true
    }),
    "99% Limits": createLineGroup("99", {
      showLabel: "Show 99% Lines", showDefault: true,
      width: 2, type: "10 10", colour: "limits", rebaselines: false, tooltipLabel: "99% Limit", tooltipPrefixes: true
    })
  }
};

export default linesSettings;
