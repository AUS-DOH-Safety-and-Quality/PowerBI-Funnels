import { toggleOption, fontOption, fontSizeOption, dropdownOption, numberOption, colourOption } from "./common";

const scatterSettings = {
  description: "Scatter Settings",
  displayName: "Scatter Settings",
  settingsGroups: {
    "Dots": {
      shape: dropdownOption("Shape", "Circle", ["Circle", "Cross", "Diamond", "Square", "Star", "Triangle", "Wye"]),
      size: numberOption("Size", 2.5, { min: 0, max: 100 }),
      colour: colourOption("Colour", "common_cause"),
      colour_outline: colourOption("Outline Colour", "common_cause"),
      width_outline: numberOption("Outline Width", 1, { min: 0, max: 100 }),
      opacity: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_selected: numberOption("Opacity if Selected", 1, { min: 0, max: 1 }),
      opacity_unselected: numberOption("Opacity if Unselected", 0.2, { min: 0, max: 1 })
    },
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
