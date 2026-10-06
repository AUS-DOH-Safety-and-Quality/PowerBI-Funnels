import { FormattingComponent, numberOption, textOption } from "powerbi-visuals-core/settings";

const miscSettings = {
  displayName: "MISC Settings",
  description: "Multi-indicator sigma chart",
  settingsGroups: {
    all: {
      group: { ...textOption("Group", ""), type: FormattingComponent.Dropdown, constant: true,
        items: [] as { displayName: string; value: string }[] },
      lower: numberOption("Lower Sigma Bound", -5),
      upper: numberOption("Upper Sigma Bound", 5),
      bar_height: numberOption("Bar Height Ratio", 0.65, { min: 0, max: 1 }),
      unfavourable_label: textOption("Unfavourable Label", "Unfavourable"),
      favourable_label: textOption("Favourable Label", "Favourable")
    }
  }
};

export default miscSettings;
