import { FormattingComponent, defaultColours, textOptions } from "./common";

const linesSettings = {
  description: "Line Settings",
  displayName: "Line Settings",
  settingsGroups: {
    "Target": {
      show_target: {
        displayName: "Show Target",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      width_target: {
        displayName: "Line Width",
        type: FormattingComponent.NumUpDown,
        default: 1.5,
        options: { minValue: { value: 0 }, maxValue: { value: 100 } }
      },
      type_target: {
        displayName: "Line Type",
        type: FormattingComponent.Dropdown,
        default: "10 0",
        valid: ["10 0", "10 10", "2 5"],
        items: [
          { displayName : "Solid",  value : "10 0" },
          { displayName : "Dashed", value : "10 10" },
          { displayName : "Dotted", value : "2 5" }
        ]
      },
      colour_target: {
        displayName: "Line Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      opacity_target: {
        displayName: "Default Opacity",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      opacity_unselected_target: {
        displayName: "Opacity if Any Selected",
        type: FormattingComponent.NumUpDown,
        default: 0.2,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      ttip_show_target: {
        displayName: "Show value in tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_target: {
        displayName: "Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Centerline"
      },
      plot_label_show_target: {
        displayName: "Show Value on Plot",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      plot_label_position_target: {
        displayName: "Position of Value on Line(s)",
        type: FormattingComponent.Dropdown,
        default: "beside",
        valid: ["above", "below", "beside"],
        items: [
          { displayName : "Above",      value : "above" },
          { displayName : "Below",      value : "below" },
          { displayName : "Beside",     value : "beside" }
        ]
      },
      plot_label_vpad_target: {
        displayName: "Value Vertical Padding",
        type: FormattingComponent.NumUpDown,
        default: 0
      },
      plot_label_hpad_target: {
        displayName: "Value Horizontal Padding",
        type: FormattingComponent.NumUpDown,
        default: 10
      },
      plot_label_font_target: {
        displayName: "Value Font",
        type: FormattingComponent.FontPicker,
        default: textOptions.font.default,
        valid: textOptions.font.valid
      },
      plot_label_size_target: {
        displayName: "Value Font Size",
        type: FormattingComponent.NumUpDown,
        default: textOptions.size.default,
        options: textOptions.size.options
      },
      plot_label_colour_target: {
        displayName: "Value Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      plot_label_prefix_target: {
        displayName: "Value Prefix",
        type: FormattingComponent.TextInput,
        default: ""
      }
    },
    "Alt. Target": {
      show_alt_target: {
        displayName: "Show Alt. Target Line",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      alt_target: {
        displayName: "Additional Target Value:",
        type: FormattingComponent.NumUpDown,
        default: undefined as number | undefined
      },
      width_alt_target: {
        displayName: "Line Width",
        type: FormattingComponent.NumUpDown,
        default: 1.5,
        options: { minValue: { value: 0 }, maxValue: { value: 100 } }
      },
      type_alt_target: {
        displayName: "Line Type",
        type: FormattingComponent.Dropdown,
        default: "10 0",
        valid: ["10 0", "10 10", "2 5"],
        items: [
          { displayName : "Solid",  value : "10 0" },
          { displayName : "Dashed", value : "10 10" },
          { displayName : "Dotted", value : "2 5" }
        ]
      },
      colour_alt_target: {
        displayName: "Line Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      opacity_alt_target: {
        displayName: "Default Opacity",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      opacity_unselected_alt_target: {
        displayName: "Opacity if Any Selected",
        type: FormattingComponent.NumUpDown,
        default: 0.2,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      join_rebaselines_alt_target: {
        displayName: "Connect Rebaselined Limits",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      ttip_show_alt_target: {
        displayName: "Show value in tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_alt_target: {
        displayName: "Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "Alt. Target"
      },
      plot_label_show_alt_target: {
        displayName: "Show Value on Plot",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      plot_label_position_alt_target: {
        displayName: "Position of Value on Line(s)",
        type: FormattingComponent.Dropdown,
        default: "beside",
        valid: ["above", "below", "beside"],
        items: [
          { displayName : "Above",      value : "above" },
          { displayName : "Below",      value : "below" },
          { displayName : "Beside",     value : "beside" }
        ]
      },
      plot_label_vpad_alt_target: {
        displayName: "Value Vertical Padding",
        type: FormattingComponent.NumUpDown,
        default: 0
      },
      plot_label_hpad_alt_target: {
        displayName: "Value Horizontal Padding",
        type: FormattingComponent.NumUpDown,
        default: 10
      },
      plot_label_font_alt_target: {
        displayName: "Value Font",
        type: FormattingComponent.FontPicker,
        default: textOptions.font.default,
        valid: textOptions.font.valid
      },
      plot_label_size_alt_target: {
        displayName: "Value Font Size",
        type: FormattingComponent.NumUpDown,
        default: textOptions.size.default,
        options: textOptions.size.options
      },
      plot_label_colour_alt_target: {
        displayName: "Value Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      plot_label_prefix_alt_target: {
        displayName: "Value Prefix",
        type: FormattingComponent.TextInput,
        default: ""
      }
    },
    "68% Limits": {
      show_68: {
        displayName: "Show 68% Lines",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      width_68: {
        displayName: "Line Width",
        type: FormattingComponent.NumUpDown,
        default: 2,
        options: { minValue: { value: 0 }, maxValue: { value: 100 } }
      },
      type_68: {
        displayName: "Line Type",
        type: FormattingComponent.Dropdown,
        default: "2 5",
        valid: ["10 0", "10 10", "2 5"],
        items: [
          { displayName : "Solid",  value : "10 0" },
          { displayName : "Dashed", value : "10 10" },
          { displayName : "Dotted", value : "2 5" }
        ]
      },
      colour_68: {
        displayName: "Line Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.limits
      },
      opacity_68: {
        displayName: "Default Opacity",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      opacity_unselected_68: {
        displayName: "Opacity if Any Selected",
        type: FormattingComponent.NumUpDown,
        default: 0.2,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      ttip_show_68: {
        displayName: "Show value in tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_68: {
        displayName: "Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "68% Limit"
      },
      plot_label_show_68: {
        displayName: "Show Value on Plot",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      plot_label_position_68: {
        displayName: "Position of Value on Line(s)",
        type: FormattingComponent.Dropdown,
        default: "beside",
        valid: ["outside", "inside", "above", "below", "beside"],
        items: [
          { displayName : "Outside",    value : "outside" },
          { displayName : "Inside",     value : "inside" },
          { displayName : "Above",      value : "above" },
          { displayName : "Below",      value : "below" },
          { displayName : "Beside",     value : "beside" }
        ]
      },
      plot_label_vpad_68: {
        displayName: "Value Vertical Padding",
        type: FormattingComponent.NumUpDown,
        default: 0
      },
      plot_label_hpad_68: {
        displayName: "Value Horizontal Padding",
        type: FormattingComponent.NumUpDown,
        default: 10
      },
      plot_label_font_68: {
        displayName: "Value Font",
        type: FormattingComponent.FontPicker,
        default: textOptions.font.default,
        valid: textOptions.font.valid
      },
      plot_label_size_68: {
        displayName: "Value Font Size",
        type: FormattingComponent.NumUpDown,
        default: textOptions.size.default,
        options: textOptions.size.options
      },
      plot_label_colour_68: {
        displayName: "Value Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      plot_label_prefix_68: {
        displayName: "Value Prefix",
        type: FormattingComponent.TextInput,
        default: ""
      }
    },
    "95% Limits": {
      show_95: {
        displayName: "Show 95% Lines",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      width_95: {
        displayName: "Line Width",
        type: FormattingComponent.NumUpDown,
        default: 2,
        options: { minValue: { value: 0 }, maxValue: { value: 100 } }
      },
      type_95: {
        displayName: "Line Type",
        type: FormattingComponent.Dropdown,
        default: "2 5",
        valid: ["10 0", "10 10", "2 5"],
        items: [
          { displayName : "Solid",  value : "10 0" },
          { displayName : "Dashed", value : "10 10" },
          { displayName : "Dotted", value : "2 5" }
        ]
      },
      colour_95: {
        displayName: "Line Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.limits
      },
      opacity_95: {
        displayName: "Default Opacity",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      opacity_unselected_95: {
        displayName: "Opacity if Any Selected",
        type: FormattingComponent.NumUpDown,
        default: 0.2,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      ttip_show_95: {
        displayName: "Show value in tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_95: {
        displayName: "Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "95% Limit"
      },
      plot_label_show_95: {
        displayName: "Show Value on Plot",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      plot_label_position_95: {
        displayName: "Position of Value on Line(s)",
        type: FormattingComponent.Dropdown,
        default: "beside",
        valid: ["outside", "inside", "above", "below", "beside"],
        items: [
          { displayName : "Outside",    value : "outside" },
          { displayName : "Inside",     value : "inside" },
          { displayName : "Above",      value : "above" },
          { displayName : "Below",      value : "below" },
          { displayName : "Beside",     value : "beside" }
        ]
      },
      plot_label_vpad_95: {
        displayName: "Value Vertical Padding",
        type: FormattingComponent.NumUpDown,
        default: 0
      },
      plot_label_hpad_95: {
        displayName: "Value Horizontal Padding",
        type: FormattingComponent.NumUpDown,
        default: 10
      },
      plot_label_font_95: {
        displayName: "Value Font",
        type: FormattingComponent.FontPicker,
        default: textOptions.font.default,
        valid: textOptions.font.valid
      },
      plot_label_size_95: {
        displayName: "Value Font Size",
        type: FormattingComponent.NumUpDown,
        default: textOptions.size.default,
        options: textOptions.size.options
      },
      plot_label_colour_95: {
        displayName: "Value Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      plot_label_prefix_95: {
        displayName: "Value Prefix",
        type: FormattingComponent.TextInput,
        default: ""
      }
    },
    "99% Limits": {
      show_99: {
        displayName: "Show 99% Lines",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      width_99: {
        displayName: "Line Width",
        type: FormattingComponent.NumUpDown,
        default: 2,
        options: { minValue: { value: 0 }, maxValue: { value: 100 } }
      },
      type_99: {
        displayName: "Line Type",
        type: FormattingComponent.Dropdown,
        default: "10 10",
        valid: ["10 0", "10 10", "2 5"],
        items: [
          { displayName : "Solid",  value : "10 0" },
          { displayName : "Dashed", value : "10 10" },
          { displayName : "Dotted", value : "2 5" }
        ]
      },
      colour_99: {
        displayName: "Line Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.limits
      },
      opacity_99: {
        displayName: "Default Opacity",
        type: FormattingComponent.NumUpDown,
        default: 1,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      opacity_unselected_99: {
        displayName: "Opacity if Any Selected",
        type: FormattingComponent.NumUpDown,
        default: 0.2,
        options: { minValue: { value: 0 }, maxValue: { value: 1 } }
      },
      ttip_show_99: {
        displayName: "Show value in tooltip",
        type: FormattingComponent.ToggleSwitch,
        default: true
      },
      ttip_label_99: {
        displayName: "Tooltip Label",
        type: FormattingComponent.TextInput,
        default: "99% Limit"
      },
      plot_label_show_99: {
        displayName: "Show Value on Plot",
        type: FormattingComponent.ToggleSwitch,
        default: false
      },
      plot_label_position_99: {
        displayName: "Position of Value on Line(s)",
        type: FormattingComponent.Dropdown,
        default: "beside",
        valid: ["outside", "inside", "above", "below", "beside"],
        items: [
          { displayName : "Outside",    value : "outside" },
          { displayName : "Inside",     value : "inside" },
          { displayName : "Above",      value : "above" },
          { displayName : "Below",      value : "below" },
          { displayName : "Beside",     value : "beside" }
        ]
      },
      plot_label_vpad_99: {
        displayName: "Value Vertical Padding",
        type: FormattingComponent.NumUpDown,
        default: 0
      },
      plot_label_hpad_99: {
        displayName: "Value Horizontal Padding",
        type: FormattingComponent.NumUpDown,
        default: 10
      },
      plot_label_font_99: {
        displayName: "Value Font",
        type: FormattingComponent.FontPicker,
        default: textOptions.font.default,
        valid: textOptions.font.valid
      },
      plot_label_size_99: {
        displayName: "Value Font Size",
        type: FormattingComponent.NumUpDown,
        default: textOptions.size.default,
        options: textOptions.size.options
      },
      plot_label_colour_99: {
        displayName: "Value Colour",
        type: FormattingComponent.ColorPicker,
        default: defaultColours.standard
      },
      plot_label_prefix_99: {
        displayName: "Value Prefix",
        type: FormattingComponent.TextInput,
        default: ""
      }
    }
  }
};

export default linesSettings;
