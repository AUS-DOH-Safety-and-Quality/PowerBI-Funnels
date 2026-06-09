import { FormattingComponent, toggleOption, numberOption, lineLabelPositionOption,
  lineTypeOption, colourOption, textOption, fontOption, fontSizeOption
 } from "./common";

const linesSettings = {
  description: "Line Settings",
  displayName: "Line Settings",
  settingsGroups: {
    "Target": {
      show_target: toggleOption("Show Target", true),
      width_target: numberOption("Line Width", 1.5, { min: 0, max: 100 }),
      type_target: lineTypeOption("Line Type", "10 0"),
      colour_target: colourOption("Line Colour", "standard"),
      opacity_target: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_target: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      ttip_show_target: toggleOption("Show value in tooltip", true),
      ttip_label_target: textOption("Tooltip Label", "Centerline"),
      plot_label_show_target: toggleOption("Show Value on Plot", false),
      plot_label_position_target: lineLabelPositionOption(),
      plot_label_vpad_target: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_target: numberOption("Value Horizontal Padding", 10),
      plot_label_font_target: fontOption("Value Font"),
      plot_label_size_target: fontSizeOption("Value Font Size"),
      plot_label_colour_target: colourOption("Value Colour", "standard"),
      plot_label_prefix_target: textOption("Value Prefix", "")
    },
    "Alt. Target": {
      show_alt_target: toggleOption("Show Alt. Target Line", false),
      alt_target: numberOption("Additional Target Value:", undefined),
      width_alt_target: numberOption("Line Width", 1.5, { min: 0, max: 100 }),
      type_alt_target: lineTypeOption("Line Type", "10 0"),
      colour_alt_target: colourOption("Line Colour", "standard"),
      opacity_alt_target: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_alt_target: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      join_rebaselines_alt_target: toggleOption("Connect Rebaselined Limits", false),
      ttip_show_alt_target: toggleOption("Show value in tooltip", true),
      ttip_label_alt_target: textOption("Tooltip Label", "Alt. Target"),
      plot_label_show_alt_target: toggleOption("Show Value on Plot", false),
      plot_label_position_alt_target: lineLabelPositionOption(),
      plot_label_vpad_alt_target: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_alt_target: numberOption("Value Horizontal Padding", 10),
      plot_label_font_alt_target: fontOption("Value Font"),
      plot_label_size_alt_target: fontSizeOption("Value Font Size"),
      plot_label_colour_alt_target: colourOption("Value Colour", "standard"),
      plot_label_prefix_alt_target: textOption("Value Prefix", "")
    },
    "68% Limits": {
      show_68: toggleOption("Show 68% Lines", false),
      width_68: numberOption("Line Width", 2, { min: 0, max: 100 }),
      type_68: lineTypeOption("Line Type", "2 5"),
      colour_68: colourOption("Line Colour", "limits"),
      opacity_68: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_68: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      ttip_show_68: toggleOption("Show value in tooltip", true),
      ttip_label_68: textOption("Tooltip Label", "68% Limit"),
      plot_label_show_68: toggleOption("Show Value on Plot", false),
      plot_label_position_68: lineLabelPositionOption(),
      plot_label_vpad_68: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_68: numberOption("Value Horizontal Padding", 10),
      plot_label_font_68: fontOption("Value Font"),
      plot_label_size_68: fontSizeOption("Value Font Size"),
      plot_label_colour_68: colourOption("Value Colour", "standard"),
      plot_label_prefix_68: textOption("Value Prefix", "")
    },
    "95% Limits": {
      show_95: toggleOption("Show 95% Lines", true),
      width_95: numberOption("Line Width", 2, { min: 0, max: 100 }),
      type_95: lineTypeOption("Line Type", "2 5"),
      colour_95: colourOption("Line Colour", "limits"),
      opacity_95: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_95: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      ttip_show_95: toggleOption("Show value in tooltip", true),
      ttip_label_95: textOption("Tooltip Label", "95% Limit"),
      plot_label_show_95: toggleOption("Show Value on Plot", false),
      plot_label_position_95: lineLabelPositionOption(),
      plot_label_vpad_95: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_95: numberOption("Value Horizontal Padding", 10),
      plot_label_font_95: fontOption("Value Font"),
      plot_label_size_95: fontSizeOption("Value Font Size"),
      plot_label_colour_95: colourOption("Value Colour", "standard"),
      plot_label_prefix_95: textOption("Value Prefix", "")
    },
    "99% Limits": {
      show_99: toggleOption("Show 99% Lines", true),
      width_99: numberOption("Line Width", 2, { min: 0, max: 100 }),
      type_99: lineTypeOption("Line Type", "10 10"),
      colour_99: colourOption("Line Colour", "limits"),
      opacity_99: numberOption("Default Opacity", 1, { min: 0, max: 1 }),
      opacity_unselected_99: numberOption("Opacity if Any Selected", 0.2, { min: 0, max: 1 }),
      ttip_show_99: toggleOption("Show value in tooltip", true),
      ttip_label_99: textOption("Tooltip Label", "99% Limit"),
      plot_label_show_99: toggleOption("Show Value on Plot", false),
      plot_label_position_99: lineLabelPositionOption(),
      plot_label_vpad_99: numberOption("Value Vertical Padding", 0),
      plot_label_hpad_99: numberOption("Value Horizontal Padding", 10),
      plot_label_font_99: fontOption("Value Font"),
      plot_label_size_99: fontSizeOption("Value Font Size"),
      plot_label_colour_99: colourOption("Value Colour", "standard"),
      plot_label_prefix_99: textOption("Value Prefix", "")
    }
  }
};

export default linesSettings;
