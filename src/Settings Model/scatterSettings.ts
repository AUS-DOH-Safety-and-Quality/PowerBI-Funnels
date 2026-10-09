import { toggleOption, fontOption, fontSizeOption, numberOption, colourOption, dotOptions } from "powerbi-visuals-core/settings";

const scatterSettings = {
  description: "Scatter Settings",
  displayName: "Scatter Settings",
  settingsGroups: {
    "Dots": dotOptions(),
    "Group Text": {
      use_group_text: toggleOption("Show Group Text", false),
      scatter_text_font: fontOption("Group Text Font"),
      scatter_text_size: fontSizeOption("Group Text Size"),
      scatter_text_colour: colourOption("Group Text Colour", "standard"),
      scatter_text_opacity: numberOption("Group Text Default Opacity", 1, { min: 0, max: 1 }),
      scatter_text_opacity_selected: numberOption("Group Text Opacity if Selected", 1, { min: 0, max: 1 }),
      scatter_text_opacity_unselected: numberOption("Group Text Opacity if Unselected", 0.2, { min: 0, max: 1 })
    }
  }
};

export default scatterSettings;
