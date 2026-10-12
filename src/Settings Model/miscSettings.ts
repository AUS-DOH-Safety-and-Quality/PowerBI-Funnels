import { FormattingComponent, numberOption, textOption } from "powerbi-visuals-core/settings";

const miscSettings = {
  displayName: "MISC Settings",
  description: "Multi-indicator sigma chart",
  settingsGroups: {
    all: {
      group: { ...textOption("Group", "Group the multi-indicator chart shows, with a bar per indicator.", ""), type: FormattingComponent.Dropdown, constant: true,
        items: [] as { displayName: string; value: string }[] },
      lower: numberOption("Lower Sigma Bound", "Left end of the z-score axis; must be below 0.", -5, { below: 0 }),
      upper: numberOption("Upper Sigma Bound", "Right end of the z-score axis; must be above 0.", 5, { above: 0 }),
      bar_height: numberOption("Bar Height Ratio", "Share of each row's height the bar fills.", 0.65, { min: 0, max: 1 }),
      unfavourable_label: textOption("Unfavourable Label", "Caption over the unfavourable (left) side.", "Unfavourable"),
      favourable_label: textOption("Favourable Label", "Caption over the favourable (right) side.", "Favourable")
    }
  }
};

export default miscSettings;
