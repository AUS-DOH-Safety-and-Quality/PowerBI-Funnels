import { toggleOption, fontOption, fontSizeOption, numberOption, colourOption, dotOptions } from "powerbi-visuals-core/settings";

const scatterSettings = {
  description: "Scatter Settings",
  displayName: "Scatter Settings",
  settingsGroups: {
    "Dots": dotOptions(),
    "Group Text": {
      use_group_text: toggleOption("Show Group Text", "Writes each group's name in place of its point.", false),
      scatter_text_font: fontOption("Group Text Font", "Font of the group names."),
      scatter_text_size: fontSizeOption("Group Text Size", "Font size of the group names, in pixels."),
      scatter_text_colour: colourOption("Group Text Colour", "Colour of the group names.", "standard"),
      scatter_text_opacity: numberOption("Group Text Default Opacity", "Opacity of the group names while nothing is selected.",
                                         1, { min: 0, max: 1 }),
      scatter_text_opacity_selected: numberOption("Group Text Opacity if Selected",
                                                  "Opacity of selected group names while a selection is active.", 1, { min: 0, max: 1 }),
      scatter_text_opacity_unselected: numberOption("Group Text Opacity if Unselected",
                                                    "Opacity of the other group names while a selection is active.", 0.2, { min: 0, max: 1 })
    }
  }
};

export default scatterSettings;
