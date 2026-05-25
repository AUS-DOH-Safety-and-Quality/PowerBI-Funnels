import { FormattingComponent, defaultColours } from "./common";

const outliersSettings = {
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
};

export default outliersSettings;
