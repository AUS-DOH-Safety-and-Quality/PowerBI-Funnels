// Re-declare FormattingComponent here to allow use in non-PBI environment
const enum FormattingComponent {
  AlignmentGroup = "AlignmentGroup",
  ColorPicker = "ColorPicker",
  ConditionalFormattingControl = "ConditionalFormattingControl",
  DatePicker = "DatePicker",
  Dropdown = "Dropdown",
  DurationPicker = "DurationPicker",
  EmptyControl = "EmptyControl",
  ErrorRangeControl = "ErrorRangeControl",
  FieldPicker = "FieldPicker",
  FlagsSelection = "FlagsSelection",
  FontControl = "FontControl",
  FontPicker = "FontPicker",
  GradientBar = "GradientBar",
  ImageUpload = "ImageUpload",
  Link = "Link",
  ListEditor = "ListEditor",
  MarginPadding = "MarginPadding",
  NumUpDown = "NumUpDown",
  ReadOnlyText = "ReadOnlyText",
  SeriesDialogLink = "SeriesDialogLink",
  ShapeMapSelector = "ShapeMapSelector",
  Slider = "Slider",
  TextArea = "TextArea",
  TextInput = "TextInput",
  ToggleSwitch = "ToggleSwitch",
}

const defaultColours = {
  improvement: "#00B0F0",
  deterioration: "#E46C0A",
  neutral_low: "#490092",
  neutral_high: "#490092",
  common_cause: "#A6A6A6",
  limits: "#6495ED",
  standard: "#000000"
}

const textOptions = {
  font: {
    type: "Dropdown",
    default: "'Arial', sans-serif",
    valid: [
      "'Arial', sans-serif",
      "Arial",
      "'Arial Black'",
      "'Arial Unicode MS'",
      "Calibri",
      "Cambria",
      "'Cambria Math'",
      "Candara",
      "'Comic Sans MS'",
      "Consolas",
      "Constantia",
      "Corbel",
      "'Courier New'",
      "wf_standard-font, helvetica, arial, sans-serif",
      "wf_standard-font_light, helvetica, arial, sans-serif",
      "Georgia",
      "'Lucida Sans Unicode'",
      "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif",
      "'Segoe UI Light', wf_segoe-ui_light, helvetica, arial, sans-serif",
      "'Segoe UI Semibold', wf_segoe-ui_semibold, helvetica, arial, sans-serif",
      "'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif",
      "Symbol",
      "Tahoma",
      "'Times New Roman'",
      "'Trebuchet MS'",
      "Verdana",
      "Wingdings"
    ]
  },
  size: {
    default: 10,
    options: { minValue: { value: 0 }, maxValue: { value: 100 } }
  },
  weight: {
    default: "normal",
    valid: ["normal", "bold", "bolder", "lighter"]
  },
  text_transform: {
    default: "uppercase",
    valid: ["uppercase", "lowercase", "capitalize", "none"]
  },
  text_overflow: {
    default: "ellipsis",
    valid: ["ellipsis", "clip", "none"]
  },
  text_align: {
    default: "center",
    valid: ["center", "left", "right"]
  }
};

const settingsModel = {
  canvas: {
    description: "Canvas Settings",
    displayName: "Canvas Settings",
    settingsGroups: {
      "all": {
        show_errors: {
          displayName: "Show Errors on Canvas",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        lower_padding: {
          displayName: "Padding Below Plot (pixels):",
          type: FormattingComponent.NumUpDown,
          default: 10
        },
        upper_padding: {
          displayName: "Padding Above Plot (pixels):",
          type: FormattingComponent.NumUpDown,
          default: 10
        },
        left_padding: {
          displayName: "Padding Left of Plot (pixels):",
          type: FormattingComponent.NumUpDown,
          default: 10
        },
        right_padding: {
          displayName: "Padding Right of Plot (pixels):",
          type: FormattingComponent.NumUpDown,
          default: 10
        }
      }
    }
  },
  funnel: {
    description: "Funnel Settings",
    displayName: "Data Settings",
    settingsGroups: {
      "all": {
        chart_type: {
          displayName: "Chart Type",
          type: FormattingComponent.Dropdown,
          default: "PR",
          valid: ["SR", "PR", "RC"],
          items: [
            { displayName : "Indirectly Standardised (HSMR)", value : "SR" },
            { displayName : "Proportion",                     value : "PR" },
            { displayName : "Rate",                           value : "RC" }
          ]
        },
        od_adjust: {
          displayName: "OD Adjustment",
          type: FormattingComponent.Dropdown,
          default: "no",
          valid: ["auto", "yes", "no"],
          items: [
            { displayName : "Automatic", value : "auto" },
            { displayName : "Yes",       value : "yes" },
            { displayName : "No",        value : "no" }
          ]
        },
        multiplier: {
          displayName: "Multiplier",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 } }
        },
        sig_figs: {
          displayName: "Decimals to Report:",
          type: FormattingComponent.NumUpDown,
          default: 2,
          options: { minValue: { value: 0 }, maxValue: { value: 20 } }
        },
        perc_labels: {
          displayName: "Report as percentage",
          type: FormattingComponent.Dropdown,
          default: "Automatic",
          valid: ["Automatic", "Yes", "No"],
          items: [
            { displayName : "Automatic",  value : "Automatic" },
            { displayName : "Yes",        value : "Yes" },
            { displayName : "No",         value : "No" }
          ]
        },
        transformation: {
          displayName: "Transformation",
          type: FormattingComponent.Dropdown,
          default: "none",
          valid: ["none", "ln", "log10", "sqrt"],
          items: [
            { displayName : "None",              value : "none" },
            { displayName : "Natural Log (y+1)", value : "ln" },
            { displayName : "Log10 (y+1)",       value : "log10" },
            { displayName : "Square-Root",       value : "sqrt" }
          ]
        },
        ttip_show_group: {
          displayName: "Show Group in Tooltip",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        ttip_label_group: {
          displayName: "Group Tooltip Label",
          type: FormattingComponent.TextInput,
          default: "Group"
        },
        ttip_show_numerator: {
          displayName: "Show Numerator in Tooltip",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        ttip_label_numerator: {
          displayName: "Numerator Tooltip Label",
          type: FormattingComponent.TextInput,
          default: "Numerator"
        },
        ttip_show_denominator: {
          displayName: "Show Denominator in Tooltip",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        ttip_label_denominator: {
          displayName: "Denominator Tooltip Label",
          type: FormattingComponent.TextInput,
          default: "Denominator"
        },
        ttip_show_value: {
          displayName: "Show Value in Tooltip",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        ttip_label_value: {
          displayName: "Value Tooltip Label",
          type: FormattingComponent.TextInput,
          default: "Automatic"
        },
        ll_truncate: {
          displayName: "Truncate Lower Limits at:",
          type: FormattingComponent.NumUpDown,
          default: <number>null
        },
        ul_truncate: {
          displayName: "Truncate Upper Limits at:",
          type: FormattingComponent.NumUpDown,
          default: <number>null
        }
      }
    }
  },
  outliers: {
    description: "Outlier Settings",
    displayName: "Outlier Settings",
    settingsGroups: {
      "General" : {
        process_flag_type: {
          displayName: "Type of Change to Flag",
          type: FormattingComponent.Dropdown,
          default: "both",
          valid: ["both", "improvement", "deterioration"],
          items: [
            { displayName : "Both",                 value : "both" },
            { displayName : "Improvement (Imp.)",   value : "improvement" },
            { displayName : "Deterioration (Det.)", value : "deterioration" }
          ]
        },
        improvement_direction: {
          displayName: "Improvement Direction",
          type: FormattingComponent.Dropdown,
          default: "increase",
          valid: ["increase", "neutral", "decrease"],
          items: [
            { displayName : "Increase", value : "increase" },
            { displayName : "Neutral",  value : "neutral" },
            { displayName : "Decrease", value : "decrease" }
          ]
        }
      },
      "Three Sigma Outliers" : {
        three_sigma: {
          displayName: "Three Sigma Outliers",
          type: FormattingComponent.ToggleSwitch,
          default: false
        },
        three_sigma_colour_improvement: {
          displayName: "Imp. Three Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.improvement
        },
        three_sigma_colour_deterioration: {
          displayName: "Det. Three Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.deterioration
        },
        three_sigma_colour_neutral_low: {
          displayName: "Neutral (Low) Three Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.neutral_low
        },
        three_sigma_colour_neutral_high: {
          displayName: "Neutral (High) Three Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.neutral_high
        }
      },
      "Two Sigma Outliers": {
        two_sigma: {
          displayName: "Two Sigma Outliers",
          type: FormattingComponent.ToggleSwitch,
          default: false
        },
        two_sigma_colour_improvement: {
          displayName: "Imp. Two Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.improvement
        },
        two_sigma_colour_deterioration: {
          displayName: "Det. Two Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.deterioration
        },
        two_sigma_colour_neutral_low: {
          displayName: "Neutral (Low) Two Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.neutral_low
        },
        two_sigma_colour_neutral_high: {
          displayName: "Neutral (High) Two Sigma Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.neutral_high
        }
      }
    }
  },
  scatter: {
    description: "Scatter Settings",
    displayName: "Scatter Settings",
    settingsGroups: {
      "Dots": {
        shape: {
          displayName: "Shape",
          type: FormattingComponent.Dropdown,
          default: "Circle",
          valid: ["Circle", "Cross", "Diamond", "Square", "Star", "Triangle", "Wye"],
          items: [
            { displayName : "Circle", value : "Circle" },
            { displayName : "Cross", value : "Cross" },
            { displayName : "Diamond", value : "Diamond" },
            { displayName : "Square", value : "Square" },
            { displayName : "Star", value : "Star" },
            { displayName : "Triangle", value : "Triangle" },
            { displayName : "Wye", value : "Wye" }
          ]
        },
        size: {
          displayName: "Size",
          type: FormattingComponent.NumUpDown,
          default: 2.5,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        colour: {
          displayName: "Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.common_cause
        },
        colour_outline: {
          displayName: "Outline Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.common_cause
        },
        width_outline: {
          displayName: "Outline Width",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        opacity: {
          displayName: "Default Opacity",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        },
        opacity_selected: {
          displayName: "Opacity if Selected",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        },
        opacity_unselected: {
          displayName: "Opacity if Unselected",
          type: FormattingComponent.NumUpDown,
          default: 0.2,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        }
      },
      "Group Text": {
        use_group_text: {
          displayName: "Show Group Text",
          type: FormattingComponent.ToggleSwitch,
          default: false
        },
        scatter_text_font: {
          displayName: "Group Text Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        scatter_text_size: {
          displayName: "Group Text Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        scatter_text_colour: {
          displayName: "Group Text Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        scatter_text_opacity: {
          displayName: "Group Text Default Opacity",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        },
        scatter_text_opacity_selected: {
          displayName: "Group Text Opacity if Selected",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        },
        scatter_text_opacity_unselected: {
          displayName: "Group Text Opacity if Unselected",
          type: FormattingComponent.NumUpDown,
          default: 0.2,
          options: { minValue: { value: 0 }, maxValue: { value: 1 } }
        }
      }
    }
  },
  lines: {
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
          default: <number>null
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
  },
  x_axis: {
    description: "X Axis Settings",
    displayName: "X Axis Settings",
    settingsGroups: {
      "Axis": {
        xlimit_colour: {
          displayName: "Axis Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        xlimit_l: {
          displayName: "Lower Limit",
          type: FormattingComponent.NumUpDown,
          default:<number>null
        },
        xlimit_u: {
          displayName: "Upper Limit",
          type: FormattingComponent.NumUpDown,
          default:<number>null
        }
      },
      "Ticks": {
        xlimit_ticks: {
          displayName: "Draw Ticks",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        xlimit_tick_count: {
          displayName: "Maximum Ticks",
          type: FormattingComponent.NumUpDown,
          default: 10,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        xlimit_tick_font: {
          displayName: "Tick Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        xlimit_tick_size: {
          displayName: "Tick Font Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        xlimit_tick_colour: {
          displayName: "Tick Font Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        xlimit_tick_rotation: {
          displayName: "Tick Rotation (Degrees)",
          type: FormattingComponent.NumUpDown,
          default: 0,
          options: { minValue: { value: -360 }, maxValue: { value: 360 } }
        }
      },
      "Label": {
        xlimit_label: {
          displayName: "Label",
          type: FormattingComponent.TextInput,
          default: <string>null
        },
        xlimit_label_font: {
          displayName: "Label Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        xlimit_label_size: {
          displayName: "Label Font Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        xlimit_label_colour: {
          displayName: "Label Font Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        }
      }
    }
  },
  y_axis: {
    description: "Y Axis Settings",
    displayName: "Y Axis Settings",
    settingsGroups: {
      "Axis": {
        ylimit_colour: {
          displayName: "Axis Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        ylimit_sig_figs: {
          displayName: "Tick Decimal Places",
          type: FormattingComponent.NumUpDown,
          default:<number>null,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        ylimit_l: {
          displayName: "Lower Limit",
          type: FormattingComponent.NumUpDown,
          default:<number>null
        },
        ylimit_u: {
          displayName: "Upper Limit",
          type: FormattingComponent.NumUpDown,
          default:<number>null
        }
      },
      "Ticks": {
        ylimit_ticks: {
          displayName: "Draw Ticks",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        ylimit_tick_count: {
          displayName: "Maximum Ticks",
          type: FormattingComponent.NumUpDown,
          default: 10,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        ylimit_tick_font: {
          displayName: "Tick Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        ylimit_tick_size: {
          displayName: "Tick Font Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        ylimit_tick_colour: {
          displayName: "Tick Font Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        ylimit_tick_rotation: {
          displayName: "Tick Rotation (Degrees)",
          type: FormattingComponent.NumUpDown,
          default: 0,
          options: { minValue: { value: -360 }, maxValue: { value: 360 } }
        }
      },
      "Label": {
        ylimit_label: {
          displayName: "Label",
          type: FormattingComponent.TextInput,
          default: <string>null
        },
        ylimit_label_font: {
          displayName: "Label Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        ylimit_label_size: {
          displayName: "Label Font Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        ylimit_label_colour: {
          displayName: "Label Font Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        }
      }
    }
  },
  labels: {
    description: "Labels Settings",
    displayName: "Labels Settings",
    settingsGroups: {
      "all": {
        show_labels: {
          displayName: "Show Value Labels",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        label_position: {
          displayName: "Label Position",
          type: FormattingComponent.Dropdown,
          default: "top",
          valid: ["top", "bottom"],
          items: [
            { displayName : "Top",    value : "top" },
            { displayName : "Bottom", value : "bottom" }
          ]
        },
        label_y_offset: {
          displayName: "Label Offset from Top/Bottom (px)",
          type: FormattingComponent.NumUpDown,
          default: 20
        },
        label_line_offset: {
          displayName: "Label Offset from Connecting Line (px)",
          type: FormattingComponent.NumUpDown,
          default: 5
        },
        label_angle_offset: {
          displayName: "Label Angle Offset (degrees)",
          type: FormattingComponent.NumUpDown,
          default: 0,
          options: { minValue: { value: -90 }, maxValue: { value: 90 } }
        },
        label_font: {
          displayName: "Label Font",
          type: FormattingComponent.FontPicker,
          default: textOptions.font.default,
          valid: textOptions.font.valid
        },
        label_size: {
          displayName: "Label Font Size",
          type: FormattingComponent.NumUpDown,
          default: textOptions.size.default,
          options: textOptions.size.options
        },
        label_colour: {
          displayName: "Label Font Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        label_line_colour: {
          displayName: "Connecting Line Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        label_line_width: {
          displayName: "Connecting Line Width",
          type: FormattingComponent.NumUpDown,
          default: 1,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        label_line_type: {
          displayName: "Connecting Line Type",
          type: FormattingComponent.Dropdown,
          default: "10 0",
          valid: ["10 0", "10 10", "2 5"],
          items: [
            { displayName : "Solid",  value : "10 0" },
            { displayName : "Dashed", value : "10 10" },
            { displayName : "Dotted", value : "2 5" }
          ]
        },
        label_line_max_length: {
          displayName: "Max Connecting Line Length (px)",
          type: FormattingComponent.NumUpDown,
          default: 1000,
          options: { minValue: { value: 0 }, maxValue: { value: 10000 } }
        },
        label_marker_show: {
          displayName: "Show Line Markers",
          type: FormattingComponent.ToggleSwitch,
          default: true
        },
        label_marker_offset: {
          displayName: "Marker Offset from Value (px)",
          type: FormattingComponent.NumUpDown,
          default: 5
        },
        label_marker_size: {
          displayName: "Marker Size",
          type: FormattingComponent.NumUpDown,
          default: 3,
          options: { minValue: { value: 0 }, maxValue: { value: 100 } }
        },
        label_marker_colour: {
          displayName: "Marker Fill Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        },
        label_marker_outline_colour: {
          displayName: "Marker Outline Colour",
          type: FormattingComponent.ColorPicker,
          default: defaultColours.standard
        }
      }
    }
  }
};

/**
 * Majority of below for temporary compatibility with older code
 * for the new settings structure, to be cleaned up in future refactor
 */

type settingsModelType = typeof settingsModel;
type settingsModelKeys = keyof settingsModelType;

type MergeUnions<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? { [K in keyof R]: R[K] }
  : never;

type settingsGroups<T> = Extract<keyof T, "settingsGroups">;
type settingsGroupMembers<T> = MergeUnions<T[settingsGroups<T>][keyof T[settingsGroups<T>]]>;
type DefaultTypes<T> = T[Extract<keyof T, "default">];

export type NestedKeysOf<T>
  = T extends object
    ? { [K in keyof T]: K extends string ? K : never; }[keyof T]
    : never;

export type defaultSettingsType = {
  [K in settingsModelKeys]: {
    [L in keyof settingsGroupMembers<settingsModelType[K]>]: DefaultTypes<settingsGroupMembers<settingsModelType[K]>[L]>
  }
}
export type defaultSettingsKeys = keyof defaultSettingsType;
export type defaultSettingsNestedKeys = NestedKeysOf<defaultSettingsType[defaultSettingsKeys]>;

const defaultSettingsArray = [];
for (const key in settingsModel) {
  const curr_card = [];
  for (const group in settingsModel[key].settingsGroups) {
    for (const setting in settingsModel[key].settingsGroups[group]) {
      curr_card.push([setting, settingsModel[key].settingsGroups[group][setting]]);
    }
  }
  defaultSettingsArray.push([key, Object.fromEntries(curr_card)]);
}

const defaultSettings = Object.fromEntries(defaultSettingsArray) as defaultSettingsType;

export { defaultSettings }
export default settingsModel;
