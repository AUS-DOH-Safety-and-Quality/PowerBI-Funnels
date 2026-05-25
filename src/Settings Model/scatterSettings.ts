import { FormattingComponent, defaultColours, textOptions } from "./common";

const scatterSettings = {
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
};

export default scatterSettings;
